'use strict';

var path = process.cwd();

module.exports = function (app, io, fetch) {
	function getStockInformations(titles) {
		let all = Promise.all(titles.map((val) => fetch("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + val + "&apikey=" + process.env.ALPHA_KEY).then((res) => res.json())));
		
		let labels = [];
		let datasets = [];
		
		return all.then((results) => {
			labels = Object.keys(results[0]["Time Series (Daily)"]).splice(30).reverse();
			
			datasets = results.map((title) => {
				if(title["Error Message"]) {
					return undefined;
				}
				
				let data = {
					label: title["Meta Data"]["2. Symbol"],
					spanGaps: true,
					data: [],
					borderColor: getRandomColor(),
					fill: false
				};
				
				for(let label of labels) {
					data.data.push(title["Time Series (Daily)"][label] && title["Time Series (Daily)"][label]["4. close"]);
				}
				
				return data;
			}).filter((val) => val !== undefined);
			
			return {
				labels,
				datasets
			};
		});
	}
	
	// https://stackoverflow.com/questions/25594478/different-color-for-each-bar-in-a-bar-chart-chartjs
	function getRandomColor() {
	    var letters = '0123456789ABCDEF'.split('');
	    var color = '#';
	    for (var i = 0; i < 6; i++ ) {
	        color += letters[Math.floor(Math.random() * 16)];
	    }
	    return color;
	}
	
	let TITLES = ["AAPL", "GOOGL", "TSLA", "MSFT", "TWTR", "SNAP"];
	let STOCK_INFO = {
		labels: [],
		datasets: []
	};
	
	getStockInformations(TITLES).then((val) => {
		STOCK_INFO = val;
		TITLES = val.datasets.map((sub) => sub.label);
		io.emit("list", STOCK_INFO);
	});
	
	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});
		
	io.on('connection', function(socket){
		console.log('a user connected');
		socket.emit("list", STOCK_INFO);
		
		socket.on('disconnect', function(){
			console.log('user disconnected');
		});
	
		socket.on("delete", function(title) {
			let index = TITLES.indexOf(title);
			
			if(index != -1) {
				TITLES.splice(index, 1);
				STOCK_INFO.datasets.splice(index, 1);
				io.emit("list", STOCK_INFO);
			}
		});
		
		socket.on("add", function(title) {
			if(TITLES.indexOf(title) == -1) {
				TITLES.push(title);
				getStockInformations(TITLES).then((val) => {
					STOCK_INFO = val;
					io.emit("list", STOCK_INFO);
				});
			}
		});
	});
};
