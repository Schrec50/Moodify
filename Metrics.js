document.addEventListener("DOMContentLoaded", async () => {
   const token = localStorage.getItem('spotify_access_token');

   try{
    // Get display name
    const namesRes = await fetch(`http://localhost:5000/get-display-name?accessToken=${token}`);
    const nameData = await namesRes.json();
    const displayName = nameData.display_name || "Unknown User";
    
    //Get SpotifyID
    const usernameRes = await fetch(`http://localhost:5000/get-user-name?accessToken=${token}`);
    const usernameData = await usernameRes.json();
    const username = usernameData.user_id;

    //Get Profile Picture
    const picRes = await fetch(`http://localhost:5000/get-account-picture?accessToken=${token}`);
    const picData = await picRes.json();
    const profilePic = picData.images?.[0]?.url || "default-pfp.jpg"


    //Put into Metrics.html
    document.querySelector(".pfp").src = profilePic;
    document.querySelector(".user-info h2").textContent = displayName
    document.querySelector(".user-info p").textContent = username;


    // Get Count of Likes/Dislikes and Display
    const swipeRes = await fetch('http://localhost:5000/count-swipes');
    const swipeData = await swipeRes.json();

    document.getElementById('swipe-count').textContent =
      `${swipeData.likes} Liked · ${swipeData.dislikes} Disliked`;

   }catch (error) {
    console.error("Error loading account info:", error);
   }

   //chart.js Chart
   try {
    const res = await fetch('http://localhost:5000/swipe-stats');
    const stats = await res.json();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Structure: genre -> action -> day -> count
    const genreMap = {};
    stats.forEach(({ track_genre, action, day, count }) => {
      if (!genreMap[track_genre]) genreMap[track_genre] = { like: {}, dislike: {} };
      genreMap[track_genre][action][day] = count;
    });

    // Prepare datasets for each genre-action combo
    const datasets = [];
    const colors = ['#1db954', '#ff4c4c', '#4c84ff', '#ffd700', '#a14fff', '#f7971e'];
    let colorIndex = 0;

    Object.entries(genreMap).forEach(([genre, actions]) => {
      ['like', 'dislike'].forEach(action => {
        const data = days.map(day => actions[action][day] || 0);
        datasets.push({
          label: `${genre} (${action})`,
          data,
          backgroundColor: colors[colorIndex % colors.length],
        });
        colorIndex++;
      });
    });

    const ctx = document.getElementById('genreChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: datasets,
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Swipe Count'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Swipe Distribution by Genre & Day (Last 7 Days)'
          }
        }
      }
    });
  } catch (err) {
    console.error("Failed to load chart data:", err);
  }
});










