// const redirect_uri = 'http://localhost/spotify/'
const redirect_uri = 'https://laikhtewari.com/spotifyusage/'
const time_range_str = 'long_term'

// PKCE Functions
function gen_code_verifier(length) {
	let result = ''
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~'
	const charactersLength = characters.length
	for (let i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}

function sha256(plain) {
	const encoder = new TextEncoder()
	const data = encoder.encode(plain)
	return window.crypto.subtle.digest('SHA-256', data)
}

function base64urlencode(a){
	return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
		.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function pkce_challenge_from_verifier(v) {
	hashed = await sha256(v);
	base64encoded = base64urlencode(hashed);
	return base64encoded;
}

async function authenticate() {
	const len_code_verifier = Math.floor(86 * Math.random() + 43)
	const code_verifier = gen_code_verifier(len_code_verifier)
	localStorage.setItem("code_verifier", code_verifier) 
	const code_challenge = await pkce_challenge_from_verifier(code_verifier) // Using functions

	const state = code_verifier
	localStorage.setItem("state", state)
	
	let authorization_uri = 'https://accounts.spotify.com/authorize?'
	authorization_uri += 'client_id=e58046da881d41baa038e46fdf037854&'
	authorization_uri += 'response_type=code&'
	authorization_uri += `redirect_uri=${encodeURIComponent(redirect_uri)}&`
	authorization_uri += 'code_challenge_method=S256&'
	authorization_uri += `code_challenge=${code_challenge}&`
	authorization_uri += `state=${state}&`
	authorization_uri += 'scope=user-top-read'

	window.location = authorization_uri
}

function logged_in() {
	document.getElementById('options').style.display = 'flex'
	document.getElementById('login').style.display = 'none'
}

function onload_housekeeping() {
	if (typeof(Storage) == "undefined") {
		alert('Uh oh... You need local storage for this app to work. Try a different browser')
	} else {
		if (localStorage.getItem('time_of_death') != null && localStorage.getItem('time_of_death') > Date.now()) { 
			logged_in()
		} else if (localStorage.getItem('access_token') != null) {
			refresh_token()
		} else {
			// add if access token already present and time still left
			const state = localStorage.getItem('state')
			const queryString = window.location.search
			const urlParams = new URLSearchParams(queryString)
			if (urlParams.has('state') && state != null) {
				if (state != urlParams.get('state')) {
					alert('Whoops, something went wrong. Try authenticating again.')
				} else {
					if (urlParams.has('error')) {
						alert(urlParams.get('error'))
					} else if (urlParams.has('code')) {
						code_verifier = localStorage.getItem('code_verifier')
						exchange_code_for_token(urlParams.get('code'), code_verifier)
					}
				}
			} else {
				console.log('New user, needs to log in')
			}
		}
	}
}

function exchange_code_for_token(code, code_verifier) {
	let formBody = new URLSearchParams({
		"client_id" : 'e58046da881d41baa038e46fdf037854',
		"grant_type" : 'authorization_code',
		"code" : code,
		'redirect_uri' : redirect_uri,
		'code_verifier' : code_verifier
	})

	fetch(
		'https://accounts.spotify.com/api/token',
		{
			method: 'POST',
			body: formBody,
			headers: {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Accept' :	'application/json'
			}
		}
	).then(res => {
		if (!res.ok) {
			alert('Something went wrong in authenticating...')
			throw new Error(res.status);
		}
		return res.json()
	}).then(data => {
		localStorage.setItem('access_token', data['access_token'])
		localStorage.setItem('refresh_token', data['refresh_token'])
		localStorage.setItem('time_of_death', data['expires_in'] * 1000 + Date.now())
		logged_in()
	}).catch(err => {
		console.log(err)
	})
}

function refresh_token() {
	console.log('Refreshing...')
	let formBody = new URLSearchParams({
		"client_id" : 'e58046da881d41baa038e46fdf037854',
		"grant_type" : 'refresh_token',
		'refresh_token' : localStorage.getItem('refresh_token')
	})

	fetch(
		'https://accounts.spotify.com/api/token',
		{
			method: 'POST',
			body: formBody,
			headers: {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Accept' :	'application/json'
			}
		}
	).then(res => {
		if (!res.ok) {
			alert('Something went wrong in authenticating...')
			throw new Error(res.status);
		}
		return res.json()
	}).then(data => {
		localStorage.setItem('access_token', data['access_token'])
		localStorage.setItem('refresh_token', data['refresh_token'])
		localStorage.setItem('time_of_death', data['expires_in'] * 1000 + Date.now())
		logged_in()
	}).catch(err => {
		console.log(err)
	})
}

// Data functions
function clear() {
	document.getElementById('myChart').style.display = 'none';
	document.getElementById('data_table').style.display = 'none';
}

function top_artists() {
	clear()
	base_url = 'https://api.spotify.com/v1/me/top/artists?'
	params = new URLSearchParams({
		'limit' : 100,
		'time_range' : time_range_str
	})

	fetch(base_url + params.toString(), {
		headers : {
			'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
		}
	}).then(res => res.json())
	.then(data => {
		console.dir(data)
		let table = document.getElementById('data_table')
		table.innerHTML = ''

		cols = ['Rank', 'Name', 'Genres', 'Popularity']

		let table_head = document.createElement('thead')
		let table_head_row = document.createElement('tr')

		cols.forEach(name => {
			let col_head = document.createElement('th')
			col_head.innerHTML = name
			table_head_row.appendChild(col_head)
		})

		table_head.appendChild(table_head_row)
		table.appendChild(table_head)

		items = data['items']

		let gen_on_click = function(uri) {
			return function() { window.open(uri) }
		}

		let table_body = document.createElement('tbody')
		for (let i = 0; i < items.length; i++) {
			let row = document.createElement('tr')

			let index_elem = document.createElement('td')
			index_elem.innerHTML = `${i + 1}.`
			row.appendChild(index_elem)

			let name_elem = document.createElement('td')
			name_elem.innerHTML = items[i]['name']
			row.appendChild(name_elem)

			let genres_elem = document.createElement('td')
			genres_elem.innerHTML = items[i]['genres'].join(', ')
			row.appendChild(genres_elem)

			let pop_elem = document.createElement('td')
			let ps = items[i]['popularity']
			pop_elem.innerHTML = ps < 25 ? 'Super Underground' : (ps < 50 ? 'Underground' : (ps < 75 ? 'Popular' : 'Super Popular'))
			row.appendChild(pop_elem)

			row.onclick = gen_on_click(items[i]['uri'])

			row.style.cursor = 'pointer'

			table_body.appendChild(row)
		}

		table.appendChild(table_body)
		table.style.display = 'table';
	})
}

function top_tracks() {
	clear()
	base_url = 'https://api.spotify.com/v1/me/top/tracks?'
	params = new URLSearchParams({
		'limit' : 100,
		'time_range' : time_range_str
	})

	fetch(base_url + params.toString(), {
		headers : {
			'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
		}
	}).then(res => res.json())
	.then(data => {
		console.dir(data)
		let table = document.getElementById('data_table')
		table.innerHTML = ''

		cols = ['Rank', 'Track', 'Album']

		let table_head = document.createElement('thead')
		let table_head_row = document.createElement('tr')

		cols.forEach(name => {
			let col_head = document.createElement('th')
			col_head.innerHTML = name
			table_head_row.appendChild(col_head)
		})

		table_head.appendChild(table_head_row)
		table.appendChild(table_head)

		items = data['items']

		let gen_on_click = function(uri) {
			return function() { window.open(uri) }
		}

		let table_body = document.createElement('tbody')
		for (let i = 0; i < items.length; i++) {
			let row = document.createElement('tr')

			let index_elem = document.createElement('td')
			index_elem.innerHTML = `${i + 1}.`
			row.appendChild(index_elem)

			let name_elem = document.createElement('td')
			name_elem.innerHTML = items[i]['name']
			row.appendChild(name_elem)

			let album_elem = document.createElement('td')
			album_elem.innerHTML = items[i]['album']['name']
			row.appendChild(album_elem)

			row.onclick = gen_on_click(items[i]['uri'])

			row.style.cursor = 'pointer'

			table_body.appendChild(row)
		}

		table.appendChild(table_body)
		table.style.display = 'table';
	})
}

function average_metrics() {
	clear()

	// Get top tracks
	tracks_base_url = 'https://api.spotify.com/v1/me/top/tracks?'
	tracks_params = new URLSearchParams({
		'limit' : 100,
		'time_range' : time_range_str
	})

	fetch(tracks_base_url + tracks_params.toString(), {
		headers : {
			'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
		}
	})
	.then(res => res.json())
	.then(data => {
		ids = data.items.map(t => t.id)
		metrics_base_url = 'https://api.spotify.com/v1/audio-features?'
		metrics_params = new URLSearchParams()
		metrics_params.append('ids', ids.join(','))
		fetch(metrics_base_url + metrics_params.toString(), {
			headers : {
				'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
			}
		})
		.then(res => res.json())
		.then(data => {
			let avg = (arr) => arr.reduce((a, b) => a + b) / arr.length
			// let acoustic_score = avg([for (f in data.audio_features) f.acousticness])			
			let dance_score = avg(data.audio_features.map(f => f.danceability))
			let dancy = dance_score >= 0.5 ? dance_score : 0
			let chill = dance_score < 0.5 ? dance_score : 0

			let energy_score = avg(data.audio_features.map(f => f.energy))
			let hype = dance_score >= 0.5 ? dance_score : 0
			let calm = dance_score < 0.5 ? dance_score : 0

			let instru_score = avg(data.audio_features.map(f => f.instrumentalness))
			let instrumental = dance_score >= 0.5 ? dance_score : 0
			let spoken = dance_score < 0.5 ? dance_score : 0

			let valence_score = avg(data.audio_features.map(f => f.valence))
			let bubbly = dance_score >= 0.5 ? dance_score : 0
			let emo = dance_score < 0.5 ? dance_score : 0

			let chart_data = {
				'labels': ['Dance', 'Hype', 'Instrumental', 'Bubbly', 'Chill', 'Calm', 'Spoken', 'Emo'],
				'datasets': [{
					'label' : 'Your Average Music Metrics',
					'backgroundColor' : 'rgba(29,185,84,0.3)',
					'data': [dancy, hype, instrumental, bubbly, chill, calm, spoken, emo]
				}]
			}

			let options = {
				'scale' : {
					'angleLines' : {
						'display': true
					},
					'ticks': {
						'suggestedMin': 0,
						'suggestedMax': 1
					}
				}
			};

			let ctx = document.getElementById('myChart');
			let myChart = new Chart(ctx, {
				type: 'radar',
				data: chart_data,
				options: options
			});
			ctx.style.display = 'block'
		})
	})
}

function recommendations() {

}
