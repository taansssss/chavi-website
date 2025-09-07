// assets/js/script.js
// Shared JS for navbar/footer, donation, counters, tickers, filtering.

document.addEventListener('DOMContentLoaded', () => {
    loadSharedParts();

    // Attach donation form listener
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', submitDonation);
    }

    // Attach newsletter form listener
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', submitNewsletter);
    }

    // Attach volunteer form listener (no modal now)
    const volForm = document.getElementById('volunteerForm');
    if (volForm) {
        volForm.addEventListener('submit', submitVolunteer);
    }
});

/* -------------------------
   Load navbar & footer
------------------------- */
function loadSharedParts() {
    fetch('navbar.html').then(r => r.text()).then(html => {
        const node = document.getElementById('navbar');
        if (node) node.innerHTML = html;
        wireNavbarAfterLoad();
        afterWidgetsLoaded();
    }).catch(err => console.warn('Could not load navbar:', err));

    fetch('footer.html').then(r => r.text()).then(html => {
        const node = document.getElementById('footer');
        if (node) node.innerHTML = html;
        wireFooterAfterLoad();
    }).catch(err => console.warn('Could not load footer:', err));
}

/* -------------------------
   Navbar events
------------------------- */
function wireNavbarAfterLoad() {
    const toggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => navLinks.classList.toggle('show'));
    }
}

/* -------------------------
   Footer events
------------------------- */
function wireFooterAfterLoad() {
    const newsForm = document.querySelector('.newsletter-form');
    if (newsForm) newsForm.addEventListener('submit', submitNewsletter);
}

const volForm = document.querySelector(".volunteer-form");
if (volForm) {
    volForm.addEventListener("submit", submitVolunteer);
}


/* -------------------------
   Volunteer form submission → backend
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    const volForm = document.querySelector(".volunteer-form");
    if (volForm) {
        volForm.addEventListener("submit", submitVolunteer);
        console.log("✅ Volunteer form listener attached");
    }
});

async function submitVolunteer(e) {
    e.preventDefault();
    console.log("✅ Volunteer form intercepted");

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    try {
        const res = await fetch("/api/volunteers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to save volunteer");

        alert("✅ Thank you! We received your volunteer request.");
        form.reset();
    } catch (err) {
        console.error("❌ Error submitting volunteer:", err);
        alert("❌ Something went wrong. Please try again later.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Application"; // match your button text
    }
}

/* -------------------------
   Newsletter form submission → backend
------------------------- */
async function submitNewsletter(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    try {
        const res = await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Failed to save newsletter subscription');

        alert('✅ Subscribed — thank you!');
        form.reset();
    } catch (err) {
        console.error(err);
        alert('❌ Something went wrong. Please try again later.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Subscribe';
    }
}

/* -------------------------
   Donation form submission → backend
------------------------- */
async function submitDonation(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());

    const amount = Number(data.amount) || 0;
    if (amount <= 0) { alert('Enter a valid amount'); return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Processing...';

    try {
        const res = await fetch('/api/donations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Failed to save donation');

        alert('✅ Donation recorded. You can proceed to payment.');
        form.reset();
    } catch (err) {
        console.error(err);
        alert('❌ Something went wrong. Try again later.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Contribute';
    }
}

/* -------------------------
   Counters, tickers, filtering
------------------------- */
function afterWidgetsLoaded() {
    initCounters();
    initTickers();
    initProjectFilter();
}

function initCounters() {
    const counters = document.querySelectorAll('[data-counter], [data-value].counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });

    counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
    const target = Number(el.dataset.counter || el.dataset.value || el.innerText.replace(/\D/g,'')) || 0;
    const duration = 1400 + Math.min(2000, target/2);
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(progress * target * progress); // smooth
        el.innerText = value.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(frame);
        else el.innerText = target.toLocaleString('en-IN');
    }
    requestAnimationFrame(frame);
}

function initTickers() {
    document.querySelectorAll('.image-ticker, .news-ticker').forEach(t => {
        t.addEventListener('mouseenter', () => t.classList.add('paused'));
        t.addEventListener('mouseleave', () => t.classList.remove('paused'));
    });
}

function initProjectFilter() {
    const filterRoot = document.querySelector('.project-filter');
    if (!filterRoot) return;
    const buttons = filterRoot.querySelectorAll('button[data-filter]');
    const cards = document.querySelectorAll('.project-card');

    buttons.forEach(btn => btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        cards.forEach(c => {
            const types = (c.dataset.type || '').split(' ').filter(Boolean);
            const years = (c.dataset.year || '').split(' ').filter(Boolean);
            if (filter === 'all' || types.includes(filter) || years.includes(filter)) {
                c.style.display = '';
            } else {
                c.style.display = 'none';
            }
        });
    }));
}
