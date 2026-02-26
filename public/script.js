// Exemple de logique à mettre dans ton script.js
async function checkUserRole() {
    const response = await fetch('/api/profile');
    const user = await response.json();

    // Remplissage des champs vides
    document.getElementById('email').textContent = user.email || "Non renseigné";
    document.getElementById('display-firstname').textContent = user.firstname || "—";
    document.getElementById('display-lastname').textContent = user.lastname || "—";

    // Affichage du formulaire de modification SEULEMENT si c'est l'admin
    if (user.role === 'admin') {
        document.getElementById('admin-edit-section').style.display = 'block';
        document.getElementById('role-display').textContent = 'Administrateur';
    }
}

checkUserRole();