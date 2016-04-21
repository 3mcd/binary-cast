'use strict'

var BinaryClient = require('binaryjs-client').BinaryClient

function audioStreamCache (context) {
    var cache = []
    var nextTime = 0

    function play () {
        while (cache.length) {
            let source = context.createBufferSource()

            source.buffer = cache.shift()
            source.connect(context.destination)

            if (nextTime === 0) {
                // add a delay of 0.05 seconds
                nextTime = context.currentTime + 0.05
            }

            source.start(nextTime)

            // schedule buffers to be played consecutively
            nextTime += source.buffer.duration
        }
    }

    function push (buffer) {
        return cache.push(buffer)
    }

    function length () {
        return cache.length
    }

    return {
        play: play,
        push: push,
        length: length
    }
}

function findBroadcast (server, broadcast) {
    var xhr = new window.XMLHttpRequest()

    xhr.open('GET', server + '/broadcasts/' + broadcast)

    xhr.send()

    return new Promise(function (resolve, reject) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                resolve(JSON.parse(xhr.responseText))
            }
        }
    })
}

function createAudioStreamClient (url) {
    const client = new BinaryClient(url)
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const cache = audioStreamCache(context)

    var init = true

    function onStream (stream) {
        stream.on('data', onData)
        stream.on('end', onEnd)
    }

    function onEnd () {
        console.log('End!')
        destroy()
    }

    function onData (data) {
        console.log('Got data')
        var array = new Float32Array(data)
        var buffer = context.createBuffer(1, 2048, 44100)

        buffer.copyToChannel(array, 0)

        cache.push(buffer)

        if (init === true || ((init === false) && (cache.length() > 15))) {
            init = true
            cache.play()
        }
    }

    function destroy () {
        client.removeListener('stream', onStream)
    }

    client.on('stream', onStream)

    return {
        context: context,
        destroy: destroy
    }
}

module.exports = {
    getBroadcast: function (location, id) {
        return findBroadcast(location, id)
            .then((data) => createAudioStreamClient(data.url))
            .catch((e) => console.error(e))
    }
}