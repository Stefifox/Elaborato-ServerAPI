//Deifinizione delle librerie utilizzate
const settings = require('./settings.json')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mysql = require('mysql')
const crypto = require('crypto-js')
const Str = require('@supercharge/strings')


//Definizione costanti
const app = express()
const port = settings.serverPort;

//Configurazione app
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

let con = mysql.createConnection({
    host: settings.database.host,
    user: settings.database.user,
    password: settings.database.password,
    database: settings.database.dbName
})

//recupero le informazioni dalla API esterna
function fetchAPI(sport) {
    search_url = "http://localhost:3000/" + sport
    return (fetch(search_url, {
            method: "GET"
        })
        .then(res => res.json())
        .then((json) => {
            return (json.data)
        }))
}

//Definizionne codice
//.get Definisce cosa deve fare il server se riceve una rihiesta di tipo get
// Pagina che viene caricata all'indirizzo principale
app.get('/', (req, res) => {
    res.status(200).send('<h1>Main page<h1>\n<h2>Server by Stefano Campostrini</h2>')
});

// /users restituisce una lista di utenti in formato JSON, in caso di errore del server mySQL restituisce un errore 500 con descrizione del problema
app.get('/users', (req, res) => {

    let response = new Object()
    response["response"] = 200
    response["description"] = "Ok"
    response["content"] = "List of users"
    response["users"] = []

    try {
        con.query(`SELECT * FROM utenti ORDER BY utenti.idUtente`, (err, ris) => {
            if (err) {
                res.status(500).json({
                    "response": 500,
                    "description": err
                })
            }
            ris.forEach(element => {
                //console.log(element)
                let data = new Object()
                data["id"] = element.idUtente
                data["nome"] = element.nome
                data["cognome"] = element.cognome
                data["mail"] = element.email
                data["username"] = element.user
                data["password"] = element.pass
                response["users"].push(data)
            });
            res.status(200).json(response)
        })
    } catch (error) {
        console.log(error)
    }

});

// /sport Permette di vedere la lista degli sport (opzionale id=N)
app.get('/sports', (req, res) => {
    let data = req.query
    let id = data.id

    let response = new Object()
    response["response"] = 200
    response["description"] = "Ok"
    response["content"] = "List of sports"
    if (id == undefined) {
        response["sports"] = []
        try {
            con.query(`SELECT * FROM sport ORDER BY sport.idSport`, (err, ris) => {
                if (err) {
                    res.status(500).json({
                        "response": 500,
                        "description": err
                    })
                }
                ris.forEach(element => {
                    //console.log(element)
                    let data = new Object()
                    data["id"] = element.idSport
                    data["nome"] = element.nome
                    response["sports"].push(data)
                });
                res.status(200).json(response)
            })
        } catch (error) {
            console.log(error)
        }
    }

    if (id != undefined) {
        try {
            con.query(`SELECT * FROM sport WHERE idSport = ${id}`, (err, ris) => {
                if (err) {
                    res.status(500).json({
                        "response": 500,
                        "description": err
                    })
                }
                if (ris.length > 0) {
                    ris.forEach(element => {
                        //console.log(element)
                        let data = {}
                        data["id"] = element.idSport
                        data["nome"] = element.nome
                        response["sport"] = data
                    });
                    res.status(200).json(response)
                } else {
                    res.status(404).json({
                        "response": 404,
                        "description": "not found",
                        "content": "no elements at id " + id
                    })
                }

            })
        } catch (error) {
            console.log(error)
        }
    }

})


app.get('/teams', (req, res) => {
    let data = req.query

    let response = new Object()
    response["response"] = 200
    response["description"] = "Ok"
    response["content"] = "List of teams"
    response["teams"] = []
    con.query(`SELECT squadre.idSquadra, squadre.nome, squadre.codNazione, sport.nome as 'sport', sport.descrizione FROM squadre, sport WHERE sport.idSport = squadre.idSport`, (err, ris) => {
        if (err) {
            res.status(500).json({
                "response": 500,
                "description": err
            })
        }
        ris.forEach(element => {
            let data = new Object()
            let sportData = {}
            data["id"] = element.idSquadra
            data["nome"] = element.nome
            data["nazione"] = element.codNazione
            sportData["nome"] = element.sport
            sportData["descrizione"] = element.descrizione
            data["sport"] = sportData
            response["teams"].push(data)

        });
        res.status(200).json(response)
    })

})

//.post Definisce cosa deve fare il server in caso di richiesta post
// /resgisttation può essere chiamato mediante metodo post e si occupa di inserire un nuovo utente nel database
app.post('/registration', (req, res) => {
    let data = req.body
    console.log(data)
    let nome = data.nome
    let cognome = data.cognome
    let mail = data.mail
    let user = data.username
    let pass = crypto.MD5(data.password).toString()

    let token = req.query.token
    if (token != 'c2e1b21e0a17d28c667cc0a774cb0152') { //Token univoco per verificare che la registrazione avviene da un app autorizzata
        let response = new Object()
        response["response"] = 400
        response["description"] = "Bad request"
        res.status(400).json(response)
        return
    }

    try {
        con.query(`INSERT INTO utenti (nome, cognome, email, username, password) VALUES (?,?,?,?,?)`, [nome, cognome, mail, user, pass], err => {

            if (err) {
                res.status(500).json({
                    "response": 500,
                    "description": err
                })
            }
            res.status(200).json({
                "response": 200,
                "description": "Ok"
            })
        })
    } catch (error) {
        console.log(error)
    }

})

app.post('/setToken', (req, res) => {
    let data = req.query
    let userId = data.id

    let randomToken = Str.random(40)  

    con.query(`SELECT * FROM utenti WHERE idUtente = "${userId}"`, (err, ris) => {
        if (err) {
            res.status(500).json({
                "response": 500,
                "description": err
            })
        }
        if (ris.length > 0) {
            con.query(`UPDATE utenti SET token = "${randomToken}" WHERE idUtente = "${userId}"`, err1 => {
                if (err1) {
                    res.status(500).json({
                        "response": 500,
                        "description": err
                    })
                }
                res.status(200).json({
                    "response": 500,
                    "description": "OK",
                    "content": "Token set successfully"
                })
            })
        } else {
            res.status(404).json({
                "response": 404,
                "description": "Not found",
                "content": "No resourced found at id " + userId
            })
        }
    })
})

// /login permette di reperire le informazioni dell'utente mediante email + password
app.post('/login', (req, res) => {
    let data = req.body
    let mail = data.mail
    let pass = crypto.MD5(data.password).toString()

    let token = req.query.token
    if (token != '51c8b422852557a12d3778270037538c') { //Token univoco per verificare che il login avviene da un app autorizzata
        let response = new Object()
        response["response"] = 400
        response["description"] = "Bad request"
        res.status(400).json(response)
        return
    }

    con.query(`SELECT * FROM utenti WHERE email = "${mail}"`, (err, ris) => {

        let response = new Object()
        response["response"] = 200
        response["description"] = "Ok"
        response["content"] = "Userdata"

        if (err) {
            res.status(500).json({
                "response": 500,
                "description": err
            })
        }
        if (ris.length > 0) {
            ris.forEach(element => {
                if (element.password === pass) {
                    let data = {}
                    data["id"] = element.idUtente
                    data["nome"] = element.nome
                    data["cognome"] = element.cognome
                    data["mail"] = element.email
                    data["username"] = element.user
                    data["password"] = element.password
                    data["identityToken"] = element.token
                    response["user"] = data
                    res.status(200).json(response)
                } else {
                    res.status(403).json({
                        "response": 403,
                        "description": "Forbidden Access",
                        "content": "Wrong password"
                    })
                }
            })
        } else {
            res.status(404).json({
                "response": 404,
                "description": "Not found",
                "content": "No element found"
            })
        }

    })
})

//.listen Avvia il server sulla porta specificata e rimane in ascolto per le richieste
app.listen(port, () => console.log(`App listening on port ${port}`))