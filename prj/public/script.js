fetch("/profile")
    .then(res => res.json())
    .then(data => {
        document.getElementById("name").innerText =
            (data.firstname || "—") + " " + (data.lastname || "");
        document.getElementById("email").innerText = data.email || "—";
        document.getElementById("photo").src = data.photo
            ? "uploads/" + data.photo
            : "uploads/default.png";

        // Extra fields for the sidebar stats
        const phoneEl = document.getElementById("phone");
        if (phoneEl) phoneEl.innerText = data.phone || "Non renseigné";

        const langEl = document.getElementById("lang");
        if (langEl) langEl.innerText = data.language === "en" ? "English 🇬🇧" : "Français 🇫🇷";
    })
    .catch(() => {
        // Redirect to login if not authenticated
        window.location.href = "/login.html";
    });