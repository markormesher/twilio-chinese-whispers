var peopleCount = 2;
var laps = 1;
var loopCounter = 0;
var latestResponseTimer = 1;
var people = [];
var originalMessage = '';
var message = '';
var automode = 'autopilot';

var TEXTS = true;

$(document).ready(function () {

	// external links
	$('a[rel=external]').click(function (e) {
		e.preventDefault();
		window.open($(this).attr('href'));
	});

	// add people
	$('button.add-person').click(function (e) {
		// moar people!
		++peopleCount;

		// add html
		$('.stage1-body').append('<div class="row" style="margin-top: 1em;">' +
		'<div class="col-sm-6">' +
		'<input type="text" class="form-control" id="name' + peopleCount + '" placeholder="Name #' + peopleCount + '"/>' +
		'</div>' +
		'<div class="col-sm-6">' +
		'<input type="text" class="form-control" id="phone' + peopleCount + '" placeholder="Phone #' + peopleCount + '"/>' +
		'</div>' +
		'</div>');
	});

	// move to message phase
	$('button.stage1-go').click(function (e) {
		// change display
		$('.stage1-body').slideUp(300);
		$('.stage1-buttons').slideUp(300);
		$('.stage2-body').slideDown(300);
		$('.stage2-buttons').slideDown(500);

		// harvest phone numbers
		for (var i = 1; i <= peopleCount; ++i) {
			people[people.length] = [$('#name' + i).val(), $('#phone' + i).val()];
		}
	});

	// start auto mode
	$('button.stage2-go-auto').click(function (e) {
		// change display
		$('.row0').slideUp(300);
		$('.row1').slideUp(500);
		$('.row2').show();

		// get the message
		message = $('#startmessage').val();
		originalMessage = message;

		// go!
		cycleAutopilot();
	});

	// start auto mode
	$('button.stage2-go-auto-u').click(function (e) {
		// change display
		$('.row0').slideUp(300);
		$('.row1').slideUp(500);
		$('.row2').show();

		// get the message
		message = $('#startmessage').val();
		originalMessage = message;

		// go!
		automode += '-u';
		cycleAutopilot();
	});

	// start interactive mode
	$('button.stage2-go-interactive').click(function (e) {
		// change display
		$('.row0').slideUp(300);
		$('.row1').slideUp(500);
		$('.row2').show();

		// get the message
		message = $('#startmessage').val();
		originalMessage = message;

		// go!
		cycleInteractive();
	});

});

function cycleAutopilot() {
	// get the next message
	$.post(
		'message-changer.php',
		{
			action: automode,
			message: message
		},
		function (data) {
			// new message
			message = data;

			// send SMS
			for (var i in people) {
				if (TEXTS) $.post(
					'twilio.php',
					{
						name: people[i][0],
						number: people[i][1],
						message: message + '(' + loopCounter + ')'
					}
				);
			}

			// print to the browser
			displayNextMessage(people[loopCounter % peopleCount][0], message);

			// advance
			++loopCounter;

			// done?
			if (loopCounter >= (laps * peopleCount)) {
				displayNextMessage('Done!', '<em>You started with:</em><br/>' + originalMessage + '<br/><br/><em>You ended up with:</em><br/>' + message);
			} else {
				// recurse
				setTimeout(function () {
					cycleAutopilot();
				}, 3000);
			}
		}
	);
}

function cycleInteractive() {
	// get the next message
	$.post(
		'message-changer.php',
		{
			action: 'interactive',
			message: message
		},
		function (data) {
			// send SMS
			message = data;
			if (TEXTS) {
				$.post(
					'twilio.php',
					{
						number: people[loopCounter % peopleCount][1],
						message: message + ' (' + loopCounter + ')'
					}
				);

				// wait for them to respond
				waitForInteractiveResponse();
			} else {
				++loopCounter;
				displayNextMessage('Test Mode', 'Test message');
				setTimeout(function () {
					cycleInteractive();
				}, 2000);
			}
		}
	);
}

function waitForInteractiveResponse() {
	// check for change to response
	$.get(
		'last-response.txt',
		function (data) {
			var chunks = data.split('//');
			if (parseInt(chunks[0]) > latestResponseTimer) {
				// update last response time
				latestResponseTimer = parseInt(chunks[0]);

				// update
				message = message.replace(/___/, chunks[1].toLowerCase());

				// print to the browser
				displayNextMessage(people[loopCounter % peopleCount][0], message);

				// advance
				++loopCounter;

				// done?
				if (loopCounter >= (laps * peopleCount)) {
					displayNextMessage('Done!', '<em>You started with:</em><br/>' + originalMessage + '<br/><br/><em>You ended up with:</em><br/>' + message);
				} else {
					// recurse
					cycleInteractive()
				}
			} else {
				//  check again
				waitForInteractiveResponse();
			}
		}
	);
}

function displayNextMessage(name, message) {
	// build output
	var output = '<div class="row" style="margin-top: 1em;">';
	if(loopCounter %2 == 0){
		output += '<div class="col-md-1 col-md-offset-2 text-right"><img src="/img/cristiano-left.png"/></div>';
	}
	output += '<div class="col-md-4' + (loopCounter % 2 == 0 ? '' : ' col-md-offset-5') + '">' +
	'<div class="alert alert-info text-' + (loopCounter % 2 == 0 ? 'left' : 'right') + '">' +
	'<h3>' + name.toUpperCase() + '</h3>' +
	'<p>' + message + '</p>' +
	'</div>' +
	'</div>';
	if(loopCounter %2 == 1){
		output += '<div class="col-md-1"><img src="/img/cristiano-right.png"/></div>';
	}
	output += '</div>';

	// append
	var outputTarget = $('.message-output');
	outputTarget.append(output);

	// scroll down
	outputTarget.animate({scrollTop: outputTarget[0].scrollHeight}, 300);
}