'use strict';

/*
	* функция для склонения слов от числительных.
	* Взято здесь: https://gist.github.com/ivan1911/5327202#gistcomment-1669858
*/

function declOfNum(number, titles) {
	var titles, number = Math.abs(number), cases = [2, 0, 1, 1, 1, 2];
	return number + ' ' + titles[(number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5]];
}

function makeTabs(selector) {
	var tab_lists_anchors = _elems(selector + ' li'), divs = _elem(selector + '_tabs').querySelectorAll('div[id*="tab_"]');
	for (var i = 0; i < tab_lists_anchors.length; i++) {
		if (tab_lists_anchors[i].classList.contains('active')) {
			divs[i].style.display = 'block';
		}
	}

	for (i = 0; i < tab_lists_anchors.length; i++) {
			_elems(selector + ' li')[i].addEventListener('click', function(e) {

			for (i = 0; i < divs.length; i++) {
				divs[i].style.display = 'none';
			}
			for (i = 0; i < tab_lists_anchors.length; i++) {
				tab_lists_anchors[i].classList.remove('active');
			}

			var clicked_tab = e.target || e.srcElement;

			clicked_tab.classList.add('active');
			var div_to_show = '#tab_' + clicked_tab.dataset.tab;

			_elem(div_to_show).style.display = 'block';
		});
	}
}

function showRemainingTime(date) {
	var remaining = tr('startsIn') + ' ', now = new Date(), delta = (date - now)/1000, days = Math.floor(delta/86400), hours = Math.floor(delta/3600), minutes = Math.floor((delta%3600)/60), browserLang = navigator.language || navigator.userLanguage;
	if (browserLang === 'ru') {
		var dayn_s = 'д', hours_s = 'час', minutes_s = 'минут';
		if (days) {
			remaining += declOfNum(days, [dayn_s+'ень', dayn_s+'ня', dayn_s+'ней']);
		} else if (hours) {
			remaining += declOfNum(hours, [hours_s, hours_s+'а', hours_s+'ов']);
			remaining += ' и ' + declOfNum(minutes, [minutes_s+'у', minutes_s+'ы', minutes_s]);
		} else if (minutes) {
			remaining += declOfNum(minutes, [minutes_s+'у', minutes_s+'ы', minutes_s]);
		} else {
			remaining += minutes_s+'у';
		}
	} else {
		if (days) {
			remaining += declOfNum(days, ['day', 'days', 'days']);
		} else if (hours) {
			remaining += declOfNum(hours, ['hour', 'hours', 'hours']);
			remaining += ' and ' + declOfNum(minutes, ['minute', 'minutes', 'minutes']);
		} else if (minutes) {
			remaining += declOfNum(minutes, ['minute', 'minutes', 'minutes']);
		} else {
			remaining += 'a minute';
		}
	}
	return remaining;
}

document.addEventListener('DOMContentLoaded', function() {
	getData(shedURL).then(showBroadcast);
	getData(apiURL).then(showSong);

	chrome.extension.sendMessage({action: 'getsett'}, function(response){
		volume.value = response.vol;
	});

	if (localStorage['defTab'] === undefined) {
		localStorage['defTab'] = 'defRadio';
		_elem('[data-tab=radio]').classList.add('active');
	} else {
		switch (localStorage['defTab']) {
			default:
			case 'defRadio':
				_elem('[data-tab=radio]').classList.add('active');
				break;
			case 'defAnime':
				_elem('[data-tab=anime]').classList.add('active');
				break;
		}
	}

	makeTabs('.tabs');

	var optionsBtn = _elem('.options'), playBtn = _elem('.playpause'), state;

	optionsBtn.addEventListener('click', function() {
		chrome.runtime.openOptionsPage();
	});

	chrome.runtime.sendMessage({cmd: 'status'}, function(response) {
		state = response.result ? 'icon icon-play' : 'icon icon-pause';
		playBtn.firstChild.setAttribute('class', state);
	});

	playBtn.addEventListener('click', function() {
		chrome.runtime.sendMessage({cmd: 'toggle'}, function(response) {
			if (response.result) {
				playBtn.firstChild.setAttribute('class', 'icon icon-play');
			} else {
				playBtn.firstChild.setAttribute('class', 'icon icon-pause');
			}
		});
	});
});

function showBroadcast(schedList) {
	var schedList = getNextSched(schedList), next = schedList.next,	current = schedList.current, nextBrEl = _elem('.nextBroadcast');
	if (current) {
		_elem('.currentBroadcast').innerHTML = '<p class="section--title">' + tr('curStream') + ':</p><p class="section--content"><a href="https://'+awURL+'/anime/" target="_blank">' + current[2].toString() + '</a></p>';
	}

	if (next[0] != null) {
		_ls_set('sched', JSON.stringify(next));

		var brTime = new Date(parseInt(next[0][0] * 1000));
		nextBrEl.innerHTML = '<p class="section--title">' + tr('nextStream') + ' (' + showRemainingTime(brTime) + '):</p>';
		nextBrEl.innerHTML += '<p class="section--content">' + next[0][2].toString() + '</p>';
		//nextBrEl.innerHTML += '<p class="section--sub-content">' + showRemainingTime(brTime) + '</p>';
	} else {
		nextBrEl.innerHTML = '<p class="section--title">'+ tr('curStream') + ':</p><p class="section--content">' + tr('noStream') + '</p>';
	}
}

function showSong(apiOuptut) {
	var radioD = JSON.parse(apiOuptut)['radio'], currSong = radioD['song']['curr'].toString().split(' - ');

	_elem('.nowPlay').innerHTML = '<p class="section--title">' + tr('nowSong') + ':</p><p class="section--content">' + currSong[0] + ' &ndash; ' + currSong[1] + '</p>';

	switch (radioD['rj']) {
		case 'Auto-DJ':
			_elem('.nowRJ').textContent = '';
			break;
		default:
			_elem('.nowRJ').innerHTML = '<p class="section--title">' + tr('airLive') + ':</p><p class="section--content"><a href="https://'+awURL+'/radio/" target="_blank">' + radioD['rj'].toString() + '</a></p>';

	}
}

var volume = _elem('.volume');

volume.addEventListener('input', function() {
	chrome.extension.sendMessage({action: 'setvol', volume: this.value});
});

volume.addEventListener('change', function() {
	_ls_set('player_vol', this.value);
});


/* Локализация */

var trTitles = [
	['.top-panel .options', 'options'],
	['.links a[href*="asianwave.ru"]', 'awSite'],
	['.links a[href*="vk.com/"]', 'awVKPage']
];

for (var i = 0; i < trTitles.length; i++) {
	_elem(trTitles[i][0]).setAttribute('title', tr(trTitles[i][1]));
}