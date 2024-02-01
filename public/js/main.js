(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);




function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData = JSON.parse(getCookie('user'));


var sender_id = userData._id
    var reciever_id;
    var global_group_id;
    var socket =  io('/user-namespace', {
        auth:{
            token: userData._id
        }
    })

    $(document).ready(function(){
        $('.user-list').click(function(){
            var id = $(this).attr('data-id')
            reciever_id = id

            $('.start-head').hide();
            $('.chat-section').show();

            socket.emit('existschat', {sender_id:sender_id, reciever_id:reciever_id})
        })
    })

    socket.on('getOnlineUser',function(data){
        $('#' + data.userid+ '-status').text('Online')
        $('#' + data.userid+ '-status').removeClass('offline-status')
        $('#' + data.userid+ '-status').addClass('online-status')
    })

    socket.on('getOfflineUser',function(data){
        $('#' + data.userid+ '-status').text('Offline')
        $('#' + data.userid+ '-status').removeClass('online-status')
        $('#' + data.userid+ '-status').addClass('offline-status')
    })

    $('#chat-form').submit((event) => {
    event.preventDefault();

    var message = $('#message').val(); // Fix the selector

    const sendData = {
        sender_id: sender_id,
        reciever_id: reciever_id,
        message: message
    };

    fetch('/save-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(data.data.message);
            $('#message').val('');
            let chat = data.data.message;
            let html = `
                <div class="current-user-chat">
                    <h5>${chat}</h5>
                </div>
            `;
            $("#chat-container").append(html)
            socket.emit('newChat', data.data)
            // Append or insert 'html' where you want in your document
        } else {
            alert(data.msg);
        }
    })
    .catch(error => console.error('Error:', error));
});
socket.on('loadnewchat',(data)=>{
    if (sender_id == data.reciever_id && reciever_id == data.sender_id) {
        let html = `
                <div class="distance-user-chat">
                    <h5>`+data.message+`</h5>
                </div>
            `;
            $("#chat-container").append(html)
    }
    
})

socket.on('loadchats',(data)=>{
    $('#chat-container').html('');
    let chats = data.chats;

    let html = '';
     for (let index = 0; index < chats.length; index++) {
         let addClass = '';
         if (chats[index]['sender_id']== sender_id) {
            addClass = 'current-user-chat'
         }else {
            addClass = 'distance-user-chat'
         }

         html += `
         <div class='`+addClass+`'>
            <h5>`+chats[index]['message']+`</h5>
        </div>
         `;
     }
     $('#chat-container').append(html)

     scrollChat();
})

function scrollChat(){
    var chatContainer = $('#chat-container');
    chatContainer.scrollTop(chatContainer.prop('scrollHeight'));
}

$('.group-list').click(function(){
	$('.group-start-head').hide();
	$('.group-chat-section').show();
	
	global_group_id = $(this).attr('data-id');

	loadGroupChat();
})    

$('#group-chat-form').submit((event) => {
    event.preventDefault();

    var message = $('#group-message').val(); // Fix the selector

    const sendData = {
        sender_id: sender_id,
        group_id: global_group_id,
        message: message
    };

    fetch('/group-chat-save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(data.chat);
            $('#group-message').val('');
            let message = data.chat.message;
            let html = `
                <div class="current-user-chat" id='`+data.chat._id+`'>
                    <h5>
					<span>${message}</h5>
                </div>
            `;
            $("#group-chat-container").append(html)
            socket.emit('newGroupChat', data.chat)
			
            // Append or insert 'html' where you want in your document
        } else {
            alert(data.msg);
        }
    })
    .catch(error => console.error('Error:', error));
});

socket.on('loadNewGroupChat', function(data){

	if (global_group_id == data.group_id) {
		let html = `
                <div class="distance-user-chat" id='`+data._id+`'>
                    <h5>
					${data.message}</h5>
                </div>
            `;
            $("#group-chat-container").append(html)

			scrollChat();
	}
	
})
function loadGroupChat(){
	fetch('/load-group-chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ group_id: global_group_id }),
	})
		.then(response => response.json())
		.then(res => {
			if (res.success) {
				var chats = res.chats;
				var html = '';
				for (let index = 0; index < chats.length; index++) {
					let className = 'distance-user-chat';
	
					if (chats[index]['sender_id'] == sender_id) {
						className = 'current-user-chat';
					}
					html += `
					<div class='${className}' id='${chats[index]['_id']}'>
						<h5>${chats[index]['message']}</h5>
					</div>
					`;
				}
				document.getElementById("group-chat-container").innerHTML = html;
			} else {
				alert(res.msg);
			}
		})
		.catch(error => console.error('Error:', error));
	
}