'use strict'

const BinaryServer = require('binaryjs').BinaryServer

module.exports = create

function create (app, ports) {
    ports = ports || 9000

    const HOSTNAME = '0.0.0.0'
    const broadcasts = {}

    app.post('/broadcasts', function (req, res) {
        var serverPort = ports++
        var playerServerPort = ports++
        var server = new BinaryServer({ port: serverPort })
        var playerServer = new BinaryServer({ port: playerServerPort })
        var id = req.body.id[0] === '/' ? req.body.id : '/' + req.body.id

        broadcasts[id] = { server, playerServer, serverPort, playerServerPort }

        server.on('connection', function (client) {
            client.on('stream', function (stream, meta) {
                for (let id in playerServer.clients) {
                    if (playerServer.clients.hasOwnProperty(id)) {
                        let send = playerServer.clients[id].createStream(meta)
                        stream.pipe(send)
                    }
                }

                playerServer.on('connection', function (client) {
                    console.log('player server connection')
                    let send = client.createStream(meta)
                    stream.pipe(send)
                })
            })
        })

        var url = 'ws://' + HOSTNAME + ':' + serverPort

        res.json({ url })
    })

    app.get('/broadcasts/:id', function (req, res) {
        var id = req.params.id[0] === '/' ? req.params.id : '/' + req.params.id
        var broadcast = broadcasts[id]
        var url = 'ws://' + HOSTNAME + ':' + broadcast.playerServerPort

        res.json({ url })
    })
}