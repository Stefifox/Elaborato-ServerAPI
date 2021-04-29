//Deifinizione delle librerie utilizzate
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mysql = require('mysql')

//Definizione costanti
const app = express()
const port = 5500;

//Configurazione app
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "elaborato"
})


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
                        response["sport"]= data
                    });
                    res.status(200).json(response)
                }

            })
        } catch (error) {
            console.log(error)
        }
    }

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
    let pass = data.password

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
// /login permette di reperire le informazioni dell'utente mediante email + password
app.post('/login', (req, res) => {
    let data = req.body
    let mail = data.mail
    let pass = data.password

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
                    response["user"] = data
                    res.status(200).json(response)
                } else {
                    res.status(200).json({
                        "response": 200,
                        "description": "Ok",
                        "content": "Wrong password"
                    })
                }
            })
        } else {
            res.status(200).json({
                "response": 200,
                "description": "Ok",
                "content": "No content"
            })
        }

    })
})

//.listen Avvia il server sulla porta specificata e rimane in ascolto per le richieste
app.listen(port, () => console.log(`App listening on port ${port}`))