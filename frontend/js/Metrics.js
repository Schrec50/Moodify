document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('spotify_access_token');
  let chart;

  try {
    const namesRes = await fetch(`http://localhost:5000/get-display-name?accessToken=${token}`);
    const nameData = await namesRes.json();
    const displayName = nameData.display_name || "Unknown User";

    const usernameRes = await fetch(`http://localhost:5000/get-user-name?accessToken=${token}`);
    const usernameData = await usernameRes.json();
    const username = usernameData.user_id;

    const picRes = await fetch(`http://localhost:5000/get-account-picture?accessToken=${token}`);
    const picData = await picRes.json();
    const profilePic = picData.images?.[0]?.url || "default-pfp.jpg";

    document.querySelector(".pfp").src = profilePic;
    document.querySelector(".user-info h2").textContent = displayName;
    document.querySelector(".user-info p").textContent = username;

    const swipeRes = await fetch('http://localhost:5000/count-swipes');
    const swipeData = await swipeRes.json();
    document.getElementById('swipe-count').textContent = `${swipeData.likes} Liked · ${swipeData.dislikes} Disliked`;
  } catch (error) {
    console.error("Error loading account info:", error);
  }

  document.getElementById('action-toggle').addEventListener('change', updateChart);

  async function updateChart() {
    const actionFilter = document.getElementById('action-toggle').value;

    try {
      const res = await fetch('http://localhost:5000/swipe-stats');
      const stats = await res.json();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const genreMap = {};
      stats.forEach(({ track_genre, action, day, count }) => {
        if (action !== actionFilter) return;
        if (!genreMap[track_genre]) genreMap[track_genre] = {};
        genreMap[track_genre][day] = count;
      });

      const datasets = [];
      const colors = ['#1db954', '#4c84ff', '#ffd700', '#a14fff', '#f7971e', '#ff4c4c'];
      let colorIndex = 0;

      Object.entries(genreMap).forEach(([genre, dayCounts]) => {
        const data = days.map(day => dayCounts[day] || 0);
        datasets.push({
          label: genre,
          data,
          backgroundColor: colors[colorIndex % colors.length],
        });
        colorIndex++;
      });

      const ctx = document.getElementById('genreChart').getContext('2d');
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              ticks: {
                color: 'white', // axis labels
                font: { size: 16 }
              },
              title: {
                display: true,
                text: 'Day of the Week',
                color: 'white', // axis title
                font: { size: 16, weight: 'bold' }
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                color: 'white', // axis labels
                font: { size: 16 }
              },
              title: {
                display: true,
                text: 'Swipe Count',
                color: 'white', // axis title
                font: { size: 20, weight: 'bold' }
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'white', // legend text
                font: { size: 15 }
              }
            },
            title: {
              display: true,
              text: `Genre Swipes (${actionFilter.charAt(0).toUpperCase() + actionFilter.slice(1)}) by Day`,
              color: 'white', // main chart title
              font: { size: 25 }
            }
          }
        }
        
      });
    } catch (err) {
      console.error("Failed to load chart data:", err);
    }
  }

  // Mood Trends
  async function loadMoodTrends() {
    try {
        const res = await fetch('http://localhost:5000/mood-trends');
        const trends = await res.json();
        const container = document.getElementById("mood-trend-list");

        container.innerHTML = ""; // Clear loading text

        trends.forEach(({ hour, day, track_genre }) => {
            let timeOfDay = "the day";
            if (hour >= 5 && hour < 12) timeOfDay = "the morning";
            else if (hour >= 12 && hour < 17) timeOfDay = "the afternoon";
            else if (hour >= 17 && hour < 22) timeOfDay = "the evening";
            else timeOfDay = "late night";

            const p = document.createElement("p");
            p.textContent = `In ${timeOfDay} on ${day}s, you like listening to ${track_genre} music.`;
            container.appendChild(p);
        });
    } catch (err) {
        console.error("Failed to load mood trends:", err);
        document.getElementById("mood-trend-list").textContent = "No mood trend data available.";
    }
}


//Top Artists
/* ---------------- TOP 5 ARTISTS (year‑to‑date) ---------------- */
const topArtistBox = document.querySelector(
  '.right-stats-column .stat-box:nth-child(2)'
);

// quick header update in case the HTML hasn’t been edited
topArtistBox.innerHTML =
  '<h4>Top 5 Artists (YTD)</h4><p>Loading…</p>';

try {
  const res = await fetch(
    `http://localhost:5000/top-artists?accessToken=${token}&time_range=long_term&limit=5`
  );
  if (!res.ok) throw new Error('Bad response');
  const data = await res.json();

  if (data.items?.length) {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = 0;

    data.items.forEach(artist => {
      const li = document.createElement('li');
      li.style.cssText =
        'display:flex;align-items:center;gap:8px;margin-bottom:6px';

      const img = document.createElement('img');
      img.src =
        artist.images?.[2]?.url || // smallest square (64 px)
        artist.images?.pop()?.url || // fallback to largest if only one
        'default-pfp.jpg';
      img.width = img.height = 28;
      img.style.borderRadius = '50%';

      const span = document.createElement('span');
      span.textContent = artist.name;

      li.append(img, span);
      ul.appendChild(li);
    });

    topArtistBox.replaceChildren(
      topArtistBox.querySelector('h4'),
      ul
    );
  } else {
    topArtistBox.querySelector('p').textContent = 'No listening data';
  }
} catch (err) {
  console.error('Top‑artist fetch error:', err);
  topArtistBox.querySelector('p').textContent = 'No listening data';
}

  updateChart();
  loadMoodTrends();

  

});
