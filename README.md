# Progetto_Angular_1_NTT_DATA

## 🚀Project Overview

This Angular application was developed as a training project. It features token-based authentication (login), user management, a dynamic post feed with comments and replies, a search section for exploring published content, and a responsive interface built with standalone components and lazy-loaded routes for optimal performance.


## 📂Project Structure
  
The application is divided into the following sections:
- Login — the first page, which requires a token to access. You can generate one directly here.
- Home Page 
- Posts Page — allows users to comment, like, view existing comments, and edit posts.
- Proponents Page — shows a list of users with the ability to view their posts by clicking on their name, as well as create or delete users.
- Search Page — lets users search for available posts by typing keywords.

## 🧩Main Libraries Used
This project is built with:
- Angular 19 — core framework for building the app
- Angular Material — UI components and styling
- RxJS — reactive data handling
- Angular Router — navigation and lazy loading
- Angular ESLint — linting and code quality tools
- Karma & Jasmine — unit testing setup

All dependencies are listed in `package.json`. No global installations required.

## 📊Test & Coverage
✅ 33 unit tests successfully executed

✅ Overall coverage:
- Statements: 66.38% ( 239/360 )
- Branches: 43.56% ( 44/101 )
- Functions: 54.65% ( 47/86 )
- Lines: 67.57% ( 223/330 )

## ⚙Project Installation

Clone the repo:
```sh
https://github.com/Elektra9000/Progetto-Angular-1-per-NTT-DATA
```

Install required packages:
```sh
npm install
```

Run the development server:
```sh
ng serve
```

To execute unit tests and generate the coverage report:
```sh
ng test --watch=false --code-coverage
```

## 🔐Authentication
To access protected features, you need to insert a personal token into sessionStorage.
You can obtain a token by registering at [GoREST](https://gorest.co.in/) and manually setting it in the browser console:
```sh
sessionStorage.setItem('gorest_token', 'YOUR_PERSONAL_TOKEN');
```

## 🔗Explore the live website [here](https://progetto-angular-1-per-ntt-data.netlify.app/)!



