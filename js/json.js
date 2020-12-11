var thumbs = {};
var serverUrl = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=readFeatured&q=';
fetch(serverUrl)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
		if (data.status == 'OK') {
			console.log(data.value);
			for (var record of data.value) {
				var level = record[4];
				if (!thumbs.hasOwnProperty(level)) {
					thumbs[level] = [];
				}
				thumbs[level].push(record);
			}
			loadThumbs();
		}
	});

function loadThumbs() {
	console.log(thumbs[1][0][3]);
	$('.img-1-0').css("background-image", `url(${thumbs[1][0][3]})`);
	$('.link-block-hero').attr('href', `/player.html#${thumbs[1][0][0]},${thumbs[1][0][2]}`);
	$('.p-hero-home').html(thumbs[1][0][1]);
	for (var i=0; i<6; i++) {
		$(`.img-2-${i}`).css("background-image", `url(${thumbs[2][i][3]})`);
		$(`.img-2-${i}`).attr('href', `/player.html#${thumbs[2][i][0]},${thumbs[2][i][2]}`)	
		$(`.img-2-${i} .p-charts-home`).html(thumbs[2][i][1]);
	}
	for (var i=0; i<6; i++) {
		$(`.img-3-${i}`).css("background-image", `url(${thumbs[3][i][3]})`);	
		$(`.img-3-${i}`).attr('href', `/player.html#${thumbs[3][i][0]},${thumbs[3][i][2]}`)
		$(`.img-3-${i} .p-charts-home`).html(thumbs[3][i][1]);
	}
	for (var i=0; i<10; i++) {
		$(`.img-4-${i} .cover-fav-home`).css("background-image", `url(${thumbs[4][i][3]})`);	
		$(`.img-4-${i}`).attr('href', `/player.html#${thumbs[4][i][0]},${thumbs[4][i][2]}`)
		$(`.img-4-${i} .h5-fav-home`).html('');
		$(`.img-4-${i} .p-fav-home`).html(thumbs[4][i][1]);
		
	}
}