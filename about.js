/* ==========================================================================
   About page interactions - Tilahun Berga
   - Scroll reveal animations
   - Animated statistics counters
   - Scroll-linked career timeline
   - Animated skill bars
   - Accessible certificate dialog
   ========================================================================== */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function formatNumber(value, decimals) {
        return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    }

    /* ----------------------------------------------------------------------
       Scroll reveal
       ---------------------------------------------------------------------- */

    var revealElements = document.querySelectorAll(".reveal");

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealElements.forEach(function (element) {
            element.classList.add("is-visible");
        });
    } else {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });
    }

    /* ----------------------------------------------------------------------
       Animated counters
       ---------------------------------------------------------------------- */

    var counters = document.querySelectorAll("[data-count]");
    var countersStarted = false;

    function readTarget(element) {
        var since = element.getAttribute("data-since");

        if (since) {
            var started = new Date(since).getTime();
            var elapsedYears = (Date.now() - started) / (365.25 * 24 * 60 * 60 * 1000);
            return {
                value: Math.max(0, elapsedYears),
                decimals: parseInt(element.getAttribute("data-decimals") || "1", 10)
            };
        }

        return {
            value: parseFloat(element.getAttribute("data-count")) || 0,
            decimals: parseInt(element.getAttribute("data-decimals") || "0", 10)
        };
    }

    function setCounter(element, value, decimals) {
        element.textContent = formatNumber(value, decimals);
    }

    function animateCounters() {
        if (countersStarted) {
            return;
        }

        countersStarted = true;

        counters.forEach(function (element) {
            var target = readTarget(element);

            if (reduceMotion) {
                setCounter(element, target.value, target.decimals);
                return;
            }

            var duration = 1400;
            var start = null;

            function step(timestamp) {
                if (start === null) {
                    start = timestamp;
                }

                var progress = Math.min((timestamp - start) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);

                setCounter(element, target.value * eased, target.decimals);

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    setCounter(element, target.value, target.decimals);
                }
            }

            window.requestAnimationFrame(step);
        });
    }

    var statsSection = document.querySelector(".stats");

    if (!reduceMotion && counters.length) {
        counters.forEach(function (element) {
            setCounter(element, 0, readTarget(element).decimals);
        });
    }

    if (statsSection) {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            animateCounters();
        } else {
            var statsObserver = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            animateCounters();
                            statsObserver.disconnect();
                        }
                    });
                },
                { threshold: 0.35 }
            );

            statsObserver.observe(statsSection);
        }
    }

    /* ----------------------------------------------------------------------
       Skill bars
       ---------------------------------------------------------------------- */

    var skillCards = document.querySelectorAll(".skill-card");

    if (reduceMotion || !("IntersectionObserver" in window)) {
        skillCards.forEach(function (card) {
            card.classList.add("is-visible");
        });
    } else {
        var skillObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        skillObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        skillCards.forEach(function (card) {
            skillObserver.observe(card);
        });
    }

    /* ----------------------------------------------------------------------
       Scroll-linked timeline progress
       ---------------------------------------------------------------------- */

    var timeline = document.querySelector(".timeline");

    if (timeline) {
        var progressFrame = null;

        function updateTimelineProgress() {
            progressFrame = null;

            var rect = timeline.getBoundingClientRect();
            var startLine = window.innerHeight * 0.8;
            var endLine = window.innerHeight * 0.25;
            var span = rect.height + (startLine - endLine);
            var progress = span > 0 ? (startLine - rect.top) / span : 0;

            progress = Math.max(0, Math.min(1, progress));
            timeline.style.setProperty("--progress", progress.toFixed(4));
        }

        function requestTimelineUpdate() {
            if (progressFrame === null) {
                progressFrame = window.requestAnimationFrame(updateTimelineProgress);
            }
        }

        updateTimelineProgress();
        window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
        window.addEventListener("resize", requestTimelineUpdate);
    }

    /* ----------------------------------------------------------------------
       Certificate dialog
       ---------------------------------------------------------------------- */

    var dialog = document.getElementById("cert-dialog");
    var dialogContent = dialog ? dialog.querySelector("[data-cert-content]") : null;
    var dialogPdfLink = dialog ? dialog.querySelector("[data-cert-pdf]") : null;
    var lastTrigger = null;

    function closeDialog() {
        if (dialog && dialog.open) {
            dialog.close();
        }
    }

    if (dialog && typeof dialog.showModal === "function") {
        document.querySelectorAll("[data-cert]").forEach(function (button) {
            button.addEventListener("click", function () {
                var template = document.getElementById(button.getAttribute("data-cert"));

                if (!template || !dialogContent) {
                    return;
                }

                lastTrigger = button;
                dialogContent.replaceChildren(template.content.cloneNode(true));

                var dialogTitle = dialogContent.querySelector(".cert-title");
                dialog.setAttribute(
                    "aria-label",
                    (dialogTitle ? dialogTitle.textContent.trim() : "Certificate") + " — certificate details"
                );

                var pdf = button.getAttribute("data-pdf");

                if (dialogPdfLink) {
                    if (pdf) {
                        dialogPdfLink.setAttribute("href", pdf);
                        dialogPdfLink.hidden = false;
                    } else {
                        dialogPdfLink.removeAttribute("href");
                        dialogPdfLink.hidden = true;
                    }
                }

                dialog.showModal();
                document.body.style.overflow = "hidden";

                var closeButton = dialog.querySelector(".dialog-close");

                if (closeButton) {
                    closeButton.focus();
                }
            });
        });

        dialog.querySelectorAll("[data-close]").forEach(function (button) {
            button.addEventListener("click", closeDialog);
        });

        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) {
                closeDialog();
            }
        });

        dialog.addEventListener("close", function () {
            document.body.style.overflow = "";

            if (lastTrigger) {
                lastTrigger.focus();
                lastTrigger = null;
            }
        });
    }
})();
