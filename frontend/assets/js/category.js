function categoriesFunction() {
  fetch('http://localhost:3000/api/categories', { method: "GET" })
    .then(response => response.json())
    .then(categories => {
      const section = document.getElementById('categoryCardsSection');

      const btnMoveLeft = document.createElement('button');
      btnMoveLeft.classList.add('btn-move', 'btn-move-left');
      btnMoveLeft.innerHTML = '<img src="assets/content/images/svg/angle-left-solid-full.svg" alt="">';
      section.appendChild(btnMoveLeft);
      btnMoveLeft.addEventListener('click', moveLeft)

      function moveLeft() {
        categoryCardsTrack.scrollLeft += boxs;
      }
      const categoryCardsTrack = document.createElement('div');
      categoryCardsTrack.classList.add('category-cards-track');
      section.appendChild(categoryCardsTrack);


      categories.forEach(element => {
        console.log(element);

        const categoryCard = document.createElement('div');
        categoryCard.classList.add('category-card');

        const img = document.createElement('img');
        img.classList.add('category-card__image');
        img.src = element.image_url;
        img.alt = element.name;

        const title = document.createElement('p');
        title.classList.add('category-card__title');
        title.textContent = element.name;

        categoryCard.appendChild(img);
        categoryCard.appendChild(title);
        categoryCardsTrack.appendChild(categoryCard)
      });
      section.appendChild(categoryCardsTrack);

      const box = document.querySelector('.category-card')
      const cards = box.children;
      const boxs = box.getBoundingClientRect().width + 20;

      let index = 0;



      const btnMoveRight = document.createElement('button');
      btnMoveRight.classList.add('btn-move', 'btn-move-right');
      btnMoveRight.innerHTML = '<img src="assets/content/images/svg/angle-right-solid-full.svg" alt="">';
      section.appendChild(btnMoveRight);
      btnMoveRight.addEventListener('click', moveRight)

      function moveRight() {
        categoryCardsTrack.scrollLeft -= boxs;
      }
    })
    .catch(error => console.error(error));
}

document.addEventListener

categoriesFunction()

