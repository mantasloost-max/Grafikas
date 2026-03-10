document.addEventListener('DOMContentLoaded', () => {
    const navList = document.getElementById('nav-list');
    const mainImage = document.getElementById('main-image');
    const mainDescription = document.getElementById('main-description');
    const currentTitle = document.getElementById('current-title');
    const imageLoader = document.getElementById('image-loader');
    const dataStatus = document.querySelector('.data-value.tech-green');

    let activeId = droneData[0].id;

    function initNav() {
        navList.innerHTML = '';

        droneData.forEach((item, index) => {
            const navItem = document.createElement('div');
            navItem.className = `nav-item ${item.id === activeId ? 'active' : ''}`;
            navItem.dataset.id = item.id;

            navItem.innerHTML = `<span style="font-family: var(--font-mono); color: var(--accent-cyan); margin-right: 15px; font-size: 0.8rem;">0${index + 1}</span> ${item.title}`;

            navItem.addEventListener('click', () => {
                if (activeId !== item.id) {
                    const prevActive = navList.querySelector('.nav-item.active');
                    if (prevActive) prevActive.classList.remove('active');

                    navItem.classList.add('active');
                    activeId = item.id;
                    updateContent(item);
                }
            });

            navList.appendChild(navItem);
        });
    }

    function scrambleText(element, newText) {
        const chars = '!<>-_\\\\/[]{}—=+*^?#________';
        const steps = 15;
        let step = 0;

        const originalText = element.textContent;
        const length = Math.max(originalText.length, newText.length);

        const interval = setInterval(() => {
            let scrambled = '';
            for (let i = 0; i < length; i++) {
                if (i < step * (length / steps) && i < newText.length) {
                    scrambled += newText[i];
                } else {
                    scrambled += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            element.textContent = scrambled;

            step++;
            if (step > steps) {
                clearInterval(interval);
                element.textContent = newText;
            }
        }, 30);
    }

    function updateContent(item) {
        // UI Glitch & Title Scramble
        scrambleText(currentTitle, item.title);

        // Status updates
        dataStatus.textContent = "SCANNING...";
        dataStatus.style.color = "var(--accent-magenta)";

        // Remove text animation
        mainDescription.classList.remove('text-reveal');

        // Trigger Reflow
        void mainDescription.offsetWidth;

        mainDescription.innerHTML = item.description;
        mainDescription.classList.add('text-reveal');

        // Image Update
        imageLoader.style.opacity = '1';
        mainImage.classList.remove('hologram-effect');
        mainImage.style.opacity = '0';

        const img = new Image();
        img.src = item.image;
        img.onload = () => {
            mainImage.src = item.image;
            mainImage.alt = item.title;
            mainImage.style.display = 'block';

            setTimeout(() => {
                imageLoader.style.opacity = '0';
                mainImage.classList.add('hologram-effect');
                dataStatus.textContent = "ONLINE";
                dataStatus.style.color = "var(--accent-green)";
            }, 400); // Artificial delay for premium feel
        };

        img.onerror = () => {
            mainImage.style.display = 'none';
            imageLoader.style.opacity = '0';
            dataStatus.textContent = "ERROR";
            dataStatus.style.color = "red";
        }
    }

    initNav();
    updateContent(droneData[0]);
});
