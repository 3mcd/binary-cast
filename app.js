'use strict'

const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')

const app = express()

const createBinaryCastServer = require('./index')

app.set('views', path.join(__dirname, '/tpl'))
app.set('view engine', 'jade')
app.engine('jade', require('jade').__express)
app.use(express.static(path.join(__dirname, '/client')))
app.use(bodyParser())

createBinaryCastServer(app, 9000)

app.get('/', function (req, res) {
    res.render('index')
})

app.get('/player', function (req, res) {
    res.render('player')
})

app.listen(3700)
