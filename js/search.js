$('.submit-button-search').on('click', () => {
	searchButtonClick();
});

function searchButtonClick() {
	var query = $('.input-search').val();
	var url = 'https://script.google.com/macros/s/AKfycbxsr0Wtr7AaLILm-4cgZ0zgUfPd7ln1VS9j5GRTVWcFSOzoVG4/exec?a=youtube&q=' + query;
	fetch(url).then(response => response.json())
		.then(data => {
			console.log(data);
			if (data.status == 'OK' && data.value.length > 0) {
				// $('#searchResults').html('');
				for (var i=0; i<data.value.length; i++) {
					var result = `
						<a href="#" class="link-block-results w-inline-block res-1-${i}">
	                        <div class="div-thumbnail"></div>
	                        <p class="p-results"><strong>title<br /></strong>channelTitle</p>
	                    </a>
	                `;
	                $('#youtubeResults').append(result);
            	}
				for (var i=0; i<data.value.length; i++) {
					$(`.res-1-${i} .div-thumbnail`).css("background-image", `url(https://i.ytimg.com/vi/${data.value[i].id.videoId}/default.jpg)`);
					$(`.res-1-${i} .p-results`).html(data.value[i].snippet.title);
					$(`.res-1-${i}`).attr('href', `player.html#${data.value[i].id.videoId},180`);
				}
				
				// for (var obj of data.value) {
				// 	$('#searchResults').append(`<a href="#" class="linkObjs" id="${obj.id.videoId}"><img src="https://i.ytimg.com/vi/${obj.id.videoId}/default.jpg">${obj.snippet.title}</a><br>`);
				// }
				// $('.linkObjs').on('click', function(){
				// 	processSong('https://www.youtube.com/watch?v=' + this.id);
				// })
			} else {
				// $('#searchResults').html('NO RESULTS');
			}
		});
}