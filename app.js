// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
let cart = [];
let buttonsDOM = [];
let bagIncrementerDOM = [];

// grab products from the provided json file and format them to more digestible object
class Products {
  async getProducts() {
    try {
      // uncomment the below if running from a live server
      // let result = await fetch("illumina-products-list.json");
      // let data = await result.json();

      // productListJson is just the original JSON file shimmed into a javascript file for the purpose of loading easily from the file system for the assignment
      let data = productListJson;
      let products = data.productList[0].productFacetInfoList;
      products = products.map((item, index) => {
        let {price, title} = item;
        // price comes in from JSON as a string, change to float
        price = parseFloat(parseFloat(price).toFixed(2));
        const id = index.toFixed(0);
        const image = item.imagePath;
        const description = item.shortDescription;
        const page = item.productPagepath;
        return {title, price, id, image, description, page};
      })
      return products;
    } catch (e) {
      console.error('e', e);
    }
  }
}

// User Interface Logic
class UI {

  displayProducts(products) {
    let result = "";
    // iterate through the products and add them to theDOM
    products.forEach(product => {
      // product template
      result += `
        <article class="product">
          <h2>
            <a href="${product.page}">
              ${product.title}
            </a>
          </h2>
          <div class="img-container">
            <img
              src=${product.image}
              alt="product"
              class="product-img"
            />
            <div class="bag-container">
              <button class="bag-btn" data-id=${product.id}>
                <i class="fas fa-shopping-cart"></i>
                add to cart
              </button>
              <div class="counter-container" data-id=${product.id}>
                <i class="fas fa-chevron-up"></i>
                <p class="item-amount">
                  1
                </p>
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>
          <h3>${product.description}</h3>
          <h4>$${product.price}</h4>
        </article>
   `;
    });
    productsDOM.innerHTML = result;
  }
  // logic for the incrementer shown before item is added to the cart
  getIncrementerButtons(){
    let incrementers = [...document.querySelectorAll(".counter-container")]
    bagIncrementerDOM = incrementers;
    incrementers.forEach(incrementer => {
      let id = incrementer.dataset.id;
      let inCart = cart.find(item => item.id === id);

      if (inCart) {
        incrementer.style.display = "none";
      } else {
        incrementer.style.display = "flex";
      }
      incrementer.addEventListener("click", event => {
        let currentAmount = parseFloat(incrementer.children[1].textContent);
        if(event.target.classList.contains("fa-chevron-up")){
          currentAmount++
        }else if(event.target.classList.contains("fa-chevron-down")){
          currentAmount--;
        }
        incrementer.children[1].textContent = currentAmount;
      })
    })
  }
  // logic for getting the bag buttons
  getBagButtons() {
    let buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);

      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", event => {
        // disable button
        event.target.innerText = "In Cart";
        event.target.disabled = true;
        // add to cart
        let incrementer = this.getSingleIncrementer(id);
        let bagAmount = parseFloat(incrementer.children[1].textContent);
        incrementer.style.display = "none";
        let cartItem = { ...Storage.getProduct(id), amount: bagAmount };
        cart = [...cart, cartItem];
        Storage.saveCart(cart);
        // add to DOM
        this.setCartValues(cart);
        this.addCartItem(cartItem);
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<!-- cart item -->
            <!-- item image -->
            <img src=${item.image} alt="product" />
            <!-- item info -->
            <div>
              <h4>${item.title}</h4>
              <h5>$${item.price}</h5>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <!-- item functionality -->
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">
                ${item.amount}
              </p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
          <!-- cart item -->
    `;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }
  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    cartContent.addEventListener("click", event => {
      // remove item from cart
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        // remove item
        this.removeItem(id);
      // increase item amount
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      // decrease item amount
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }
  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    let incrementer = this .getSingleIncrementer(id);
    button.disabled = false;
    incrementer.style.display = "flex";
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>Add to Cart`;
  }
  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }
  getSingleIncrementer(id) {
    return bagIncrementerDOM.find(incrementer => incrementer.dataset.id === id);
  }
}

// use local storage to persist the cart and products
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

//wait until DOM is loaded and start adding products from the list
document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  ui.setupAPP(); // setup and populate cart from local storage

  // get all products
  products
    .getProducts()// first grab all the products from provided JSON
    .then(products => { // display products and add to local storage
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => { // after products have been added
      ui.getBagButtons();
      ui.cartLogic();
      ui.getIncrementerButtons();
    });
});
