function calculateYears(date) {
    const startDate = new Date(date);
    const currentDate = new Date();

    let years = currentDate.getFullYear() - startDate.getFullYear();
    const month = currentDate.getMonth() - startDate.getMonth();

    if (
        month < 0 ||
        (month === 0 && currentDate.getDate() < startDate.getDate())
    ) {
        years--;
    }
    return years;
}

// Se ejecuta automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    const element = document.getElementById("experience-years");
    if (element) {
        // Cambia aquí la fecha deseada (Formato: AAAA-MM-DD)
        element.innerText = calculateYears("2018-07-15");
    }
});

// Se ejecuta automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    const element = document.getElementById("django-experience-years");
    if (element) {
        // Cambia aquí la fecha deseada (Formato: AAAA-MM-DD)
        element.innerText = calculateYears("2022-01-15");
    }
});
