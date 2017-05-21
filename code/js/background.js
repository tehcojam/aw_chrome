'use strict'

/*
 * Удаление всех старых переменных в хранилище
 * (временное решение)
 */

Object.keys(localStorage).forEach(function(key) {
	if (!key.startsWith('aw_chr')) $ls.rm(key)
})

/*
 * Каждый раз при загрузке расширение возвращает бадж в его "дефолтное" состояние
 */

var extension = chrome.browserAction

extension.setBadgeBackgroundColor({color: [100, 100, 100, 1]})
extension.setBadgeText({text: ''})

/*
 * Настройка радио
 */

function getRadioSrc() {
	return 'https://listen' + $currentPoint.srv() + '.' + domain.mr + '/' + $currentPoint.port()
}

var
	radio = new Audio(),
	volume

if (!$ls.get('aw_chr_radioVol')) {
	volume = 50; $ls.set('aw_chr_radioVol', volume)
} else volume = $ls.get('aw_chr_radioVol');

radio.preload = 'none'
radio.volume = $ls.get('aw_chr_radioVol')/100

radio.toggle = function() {
	if (radio.paused) {
		radio.src = getRadioSrc()
		radio.play()
		if (userBrowser != 'opera')
			extension.setBadgeText({text: '\u23F5'})
			else extension.setBadgeText({text: 'play'})
	} else {
		radio.src = ''
		extension.setBadgeText({text: ''})
	}
}

/*
 * Обработчики событий
 */

chrome.runtime.onMessage.addListener(function(mes, sender, sendResponse) {
	switch (mes.cmd) {
		case 'toggle':
			radio.toggle()
			sendResponse({'result': radio.paused}); break
		case 'status':
			sendResponse({'result': radio.paused}); break
		case 'getVol':
			sendResponse({'result': volume}); break
		case 'setVol':
			volume = mes.volume
			radio.volume = volume/100
			break
		case 'changePoint':
			$ls.set('aw_chr_radioOnPause', radio.paused)
			$ls.set('aw_chr_radioPoint', mes.point)
			radio.src = getRadioSrc()
			radio.load()
			if ($ls.get('aw_chr_radioOnPause') == 'false') { radio.play() }
			$ls.rm('aw_chr_radioOnPause')
	}
})

chrome.alarms.onAlarm.addListener(function(alarm) {
	getData(API.anime_sched).then(checkSched)
})
