document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector(".button");

  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const team1 = document.querySelector("#team1").value;
    const team2 = document.querySelector("#team2").value;
    const venue = document.querySelector("#venue").value;
    const weather = document.querySelector("#weather").value;
    const pitch = document.querySelector("#pitch").value;
    if(team1==team2){
        alert("Please Enter the two diiferent teams")
    }
    else{


    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          team1,
          team2,
          venue,
          weather,
          pitch,
        }),
      });

      const data = await response.json();
      const resultBox = document.getElementById("resultBox");

      // --- Clear previous results completely before adding new ---
      resultBox.innerHTML = "";

      if (data.error) {
        resultBox.style.display = "block";
        resultBox.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
        return;
      }

      // Smooth fade-in animation
      resultBox.style.display = "block";
      resultBox.classList.remove("show");
      setTimeout(() => resultBox.classList.add("show"), 100);

      // Basic match info
      const infoHTML = `
        <h2>📊 Prediction Result</h2>
        <p><strong>${data.team1}</strong> vs <strong>${data.team2}</strong></p>
        <p>🏟 Venue: ${data.venue}</p>
        <p>🏆 Predicted Winner: <b>${data.predicted_result}</b></p>
      `;
      resultBox.innerHTML = infoHTML;

      // Progress bars container
      const progressHTML = `
        <div class="progress">
          <div id="bar1" class="bar gold"></div>
        </div>
        <div class="progress">
          <div id="bar2" class="bar green"></div>
        </div>
      `;
      resultBox.innerHTML += progressHTML;

      // Animate progress bars
      animateBar("bar1", data.prob_team1, `${data.prob_team1}%`);
      animateBar("bar2", data.prob_team2, `${data.prob_team2}%`);

    } catch (error) {
      alert("Request failed: " + error);
    }}
  });

  // Smooth animation for progress bars
  function animateBar(barId, targetPercent, labelText) {
    const bar = document.getElementById(barId);
    let width = 0;
    const duration = 15; // smaller = faster
    const interval = setInterval(() => {
      if (width >= targetPercent) {
        clearInterval(interval);
        bar.textContent = labelText;
      } else {
        width++;
        bar.style.width = width + "%";
      }
    }, duration);
  }
});
// ========================
// Swipe Navigation Script
// ========================
document.addEventListener("DOMContentLoaded", () => {
  let startX = 0;
  let endX = 0;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  document.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
  });

  function handleSwipe() {
    const diffX = endX - startX;

    // Swipe sensitivity
    if (Math.abs(diffX) < 80) return; // ignore small moves

    if (diffX > 80) {
      // 👉 Swipe Right → Previous page
      goToPreviousPage();
    } else if (diffX < -80) {
      // 👈 Swipe Left → Next page
      goToNextPage();
    }
  }

  function goToPreviousPage() {
    const path = window.location.pathname;

    if (path === "/" || path === "/home") {
      window.location.href = "/about";
    } else if (path === "/about") {
      window.location.href = "/predict";
    } else if (path === "/predict") {
      window.location.href = "/knowledge";
    } else if (path === "/knowledge") {
      window.location.href = "/";
    }
  }

  function goToNextPage() {
    const path = window.location.pathname;

    if (path === "/" || path === "/home") {
      window.location.href = "/knowledge";
    } else if (path === "/knowledge") {
      window.location.href = "/predict";
    } else if (path === "/predict") {
      window.location.href = "/about";
    } else if (path === "/about") {
      window.location.href = "/";
    }
  }
});





