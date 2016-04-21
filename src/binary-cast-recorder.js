'use strict'

var BinaryClient = require('binaryjs-client').BinaryClient

const scriptProcessors = {}

var createBroadcast = function (location, id) {
    var xhr = new window.XMLHttpRequest()

    xhr.open('POST', location + '/broadcasts/')
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')

    xhr.send(JSON.stringify({ id }))

    return new Promise(function (resolve, reject) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                resolve(JSON.parse(xhr.responseText))
            }
        }
    })
}

var initializeBroadcast = function (url, mediaStream) {
    var stream
    const client = new BinaryClient(url)

    var recording = false

    function start () {
        recording = true
    }

    function stop () {
        recording = false
        stream.end()
    }

    client.on('open', function () {
        console.log('BinaryJS connection open.')
        stream = client.createStream()

        const bufferSize = 2048
        const context = new (window.AudioContext || window.webkitAudioContext)()

        // the sample rate is in context.sampleRate
        const mediaStreamAudioSourceNode = context.createMediaStreamSource(mediaStream)
        const scriptProcessor = context.createScriptProcessor(bufferSize, 1, 1)

        // Prevent ScriptProcessor from being garbage collected
        scriptProcessors['scriptProcessor_' + Math.random().toString().slice(2, 7)] = scriptProcessor

        scriptProcessor.onaudioprocess = function (e) {
            if (!recording) return
            var left = e.inputBuffer.getChannelData(0)
            console.log('Writing data to stream!')
            stream.write(left)
        }

        mediaStreamAudioSourceNode.connect(scriptProcessor)
        scriptProcessor.connect(context.destination)
    })

    return { start, stop }
}

module.exports = {
    createBroadcast: function (location, id, mediaStream) {
        return createBroadcast(location, id)
            .then((data) => initializeBroadcast(data.url, mediaStream))
            .catch((e) => console.error(e))
    }
}