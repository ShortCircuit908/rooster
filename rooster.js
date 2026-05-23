const target_events = [
	"nr:followed",
	//"nr:unfollowed",
	"nr:new_post",
	"nr:new_addition",
	"nr:new_staple",
	"nr:post_stapled",
	"nr:post_stickered",
	"nr:new_ask"
];

target_events.forEach(target_event => {
	document.addEventListener(target_event, function (e) {
		browser.runtime.sendMessage(
			{
				"event": target_event,
				"data": e.detail,
				"self": window.__NR_APP?.user.username,
			}
		);
	});
});

console.log("[Rooster] Listening for events: " + JSON.stringify(target_events));
