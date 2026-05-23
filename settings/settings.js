function loadSelectedUsers() {
	browser.storage.local.get("rooster_notified_users")
		   .then(
			   function (item) {
				   removeAllUsers();
				   for (const user of item.rooster_notified_users) {
					   addUser(user);
				   }
			   }, function (error) {
				   console.log(error);
			   }
		   );
}

function saveSelectedUsers() {
	let users = getUsers();
	browser.storage.local.set({"rooster_notified_users": users});
}

function removeAllUsers() {
	document.getElementById("receive-notifications").innerHTML = "";
}

function removeUser(entry) {
	document.getElementById("receive-notifications").removeChild(entry);
}

function addUser(user) {
	let list = document.getElementById("receive-notifications");
	let entry = window.user_entry_template.cloneNode(true);
	entry.getElementsByTagName("span")[0].innerText = user;
	entry.getElementsByTagName("input")[0].onclick = function () {
		removeUser(entry);
		saveSelectedUsers();
	};
	list.appendChild(entry);
}

function getUsers() {
	return [...document.querySelectorAll("#receive-notifications > .user-entry span")]
		.map((entry) => entry.innerText);
}

function getAndRemoveUserEntryTemplate() {
	window.user_entry_template = document.getElementById("user-entry-template");
	window.user_entry_template.parentNode.removeChild(window.user_entry_template);
	window.user_entry_template.removeAttribute("id");
}

function getParentForm(form_element) {
	if (form_element.tagName === "FORM") {
		return form_element;
	}
	if (form_element.tagName === "HTML") {
		return null;
	}
	return getParentForm(form_element.parentNode);
}

function onUsernameSubmit() {
	let input = document.getElementById("input-username");
	let username = input.value.trim().toLowerCase();
	if (username !== "" && !getUsers().includes(username)) {
		addUser(username);
		saveSelectedUsers();
		getParentForm(input).reset();
	}
}

document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("input-username-form").onsubmit = function () {
		onUsernameSubmit();
		return false;
	};
	getAndRemoveUserEntryTemplate();
	loadSelectedUsers();
});
