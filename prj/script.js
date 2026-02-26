fetch("/profile")
.then(res => res.json())
.then(data => {
    document.getElementById("name").innerText =
        data.firstname + " " + data.lastname;
    document.getElementById("email").innerText = data.email;
    document.getElementById("photo").src =
        "uploads/" + data.photo;
});