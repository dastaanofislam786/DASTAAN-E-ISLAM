// ======================================
// Universal Ripple Effect
// Version 1.0.4
// ======================================

document.addEventListener("click", function (e) {

    const button = e.target.closest(".ripple");

    if (!button) return;

    const circle = document.createElement("span");

    const size = Math.max(button.clientWidth, button.clientHeight);

    circle.style.width = size + "px";
    circle.style.height = size + "px";

    const rect = button.getBoundingClientRect();

    circle.style.left = (e.clientX - rect.left - size / 2) + "px";
    circle.style.top = (e.clientY - rect.top - size / 2) + "px";

    button.appendChild(circle);

    setTimeout(() => {

        circle.remove();

    }, 600);

});