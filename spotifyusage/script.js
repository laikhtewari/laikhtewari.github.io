// const redirect_uri = 'http://localhost/spotify/'
const redirect_uri = 'https://laikhtewari.com/spotifyusage/'

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
		if (localStorage.getItem('access_token') != null) {
			logged_in()
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
	console.log('new code verifier: ' + code_verifier)
	let formBody = new URLSearchParams({
		"client_id" : 'e58046da881d41baa038e46fdf037854',
		"grant_type" : 'authorization_code',
		"code" : code,
		'redirect_uri' : redirect_uri,
		'code_verifier' : code_verifier
	})

	obj = fetch(
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
		logged_in()
	}).catch(err => {
		console.log(err)
	})
}

// Data functions
function top_artists() {
	base_url = 'https://api.spotify.com/v1/me/top/artists?'
	params = new URLSearchParams()
	params.append('limit', 100)

	fetch(base_url + params.toString(), {
		headers : {
			'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
		}
	}).then(res => res.json())
	.then(data => {
		console.dir(data)
		let table = document.getElementById('data_table')
		table.innerHTML = ''

		cols = ['Rank', 'Name', 'Genres']

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

			// let pop_elem = document.createElement('td')
			// pop_elem.innerHTML = items[i]['genres'].join(', ')
			// row.appendChild(genres_elem)

			row.onclick = gen_on_click(items[i]['uri'])

			row.style.cursor = 'pointer'

			table.appendChild(row)
		}
	})
}

function top_tracks() {
	base_url = 'https://api.spotify.com/v1/me/top/tracks?'
	params = new URLSearchParams()
	params.append('limit', 100)

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

			table.appendChild(row)
		}
	})
}

function average_metrics() {

}

function recommendations() {

}