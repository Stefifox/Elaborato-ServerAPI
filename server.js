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
app.use(bodyParser.urlencoded({ extended: false }));
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

    con.query(`SELECT * FROM utenti ORDER BY utenti.idUtente`, (err, ris)=>{
        if(err){
            res.status(500).json({"response":500,"description": err})
            throw err
        }
        ris.forEach(element => {
            //console.log(element)
            let data = new Object()
            data["id"] = element.idUtente
            data["username"] = element.user
            data["password"] = element.pass
            response["users"].push(data)
        });
        res.status(200).json(response)
    }) 
});

//.post Definisce cosa deve fare il server in caso di richiesta post
// /resgisttation può essere chiamato mediante metodo post e si occupa di inserire un nuovo utente nel database
app.post('/registration', (req, res)=>{
    let data = req.body
    let user = data.username
    let pass = data.password

    con.query(`INSERT INTO utenti (user, pass) VALUES (?,?)`,[user, pass], err=>{

        if(err){
            res.status(500).json({"response":500,"description": err})
            throw err
        }
        res.status(200).json({"response":200,"description": "Ok"})
    })    
})

//.listen Avvia il server sulla porta specificata e rimane in ascolto per le richieste
app.listen(port, () => console.log(`App listening on port ${port}`))