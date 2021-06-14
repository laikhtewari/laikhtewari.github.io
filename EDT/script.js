function write_data() {
	let name = document.getElementById('name').value
	let city = document.getElementById('city').value
	let amb = document.getElementById('ambiance').value
	let pres = document.getElementById('presentation').value
	let taste = document.getElementById('taste').value
	let serv = document.getElementById('service').value
	let emoji = document.getElementById('emoji').value

	rest_ref = firebase.database().ref().child(`restaurants/${name}`)
	let data = {
		'city': city,
		'ambiance': amb,
		'presentation': pres,
		'taste': taste,
		'service': serv,
		'emoji': emoji
	}
	rest_ref.update(data);
}

function setup() {
	console.log('Setting up...')
	const firebaseConfig = {
	  apiKey: "AIzaSyDc2br7PsPDMv7P1-pEVBF3Dj00elpE1g4",
	  authDomain: "eatdrinktravel-231f8.firebaseapp.com",
	  databaseURL: "https://eatdrinktravel-231f8-default-rtdb.firebaseio.com",
	  projectId: "eatdrinktravel-231f8",
	  storageBucket: "eatdrinktravel-231f8.appspot.com",
	  messagingSenderId: "596881137265",
	  appId: "1:596881137265:web:972cb2482e8b19ee5605d0"
	};
	firebase.initializeApp(firebaseConfig);
	console.log('Initialized App')
	var database = firebase.database();

	let table = document.getElementById('data_table')
	table.innerHTML = ''
	cols = ['Name', 'city', 'ambiance', 'presentation', 'taste', 'service', 'emoji']
	let table_head = document.createElement('thead')
	let table_head_row = document.createElement('tr')
	cols.forEach(name => {
		let col_head = document.createElement('th')
		col_head.innerHTML = name
		table_head_row.appendChild(col_head)
	})
	table_head.appendChild(table_head_row)
	table.appendChild(table_head)

	var restaurants_ref = firebase.database().ref('restaurants/');
	restaurants_ref.on('value', (snapshot) => {
		console.log('loaded data')
		const data = snapshot.val();
		console.dir(data)		
		let table_body = document.createElement('tbody')
		for (const name in data) {
			let row = document.createElement('tr')
			name_elem = document.createElement('td')
			name_elem.innerHTML = name
			row.append(name_elem)
			cols.forEach(col_name => {
				if (col_name != 'Name') {
					let elem = document.createElement('td')
					elem.innerHTML = data[name][col_name]
					row.appendChild(elem)
				}
			})
			table_body.appendChild(row)
		}
		table.appendChild(table_body)
		table.style.display = 'table';
	});
}

setup()