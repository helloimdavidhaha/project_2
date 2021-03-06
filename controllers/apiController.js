const models = require('../models/');
let mode;

function darkMode(req) {
    if (req.isAuthenticated()) {
        mode = req.user.dark_mode;
    } else {
        mode = false;
    }
    return mode;
}

module.exports = {
    getBooks: (req, res) => {
        models.Book.findAll({}).then(results => {
            const booksObj = {
                books: results
            };
            console.log(booksObj);
            res.json(booksObj);
        }).catch(error => {
            console.error(error);
        });
    },
    createBook: (req, res) => {
        const book = req.body;
        models.Book.create({
            title: book.title,
            body: book.body,
            text_limit: 500,
            genre: book.genre,
            imageUrl: book.imageUrl,
            author: book.author
        }).then(result => {
            let bookObj = {
                id: result.id,
                title: book.title
            }
            console.log('added book: ');
            console.log(bookObj);
            return res.json(bookObj).status(201).end();
            // req.io.emit('added book', bookObj);
        }).catch(error => {
            console.error(error);
            return res.json(error.error).status(406).end;
        });
    },
    updateBook: (req, res) => {
        const book = req.body;
        console.log('this book');
        console.log(book.imageUrl);
        models.Book.update({
            title: book.title,
            body: book.body,
            text_limit: book.limit,
            genre: book.genre,
            imageUrl: book.imageUrl
        }, {
            where: {
                id: req.params.id
            }
        }).then(result => {
            if (result.changedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                res.status(200).end();
            }
        }).catch(error => {
            console.error(error);
        });
    },
    completeBook: (req, res) => {
        models.Book.update({
            completed: true
        }, {
            where: {
                id: req.params.id
            }
        }).then(result => {
            if (result.changedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                res.status(200).end();
                console.log('BOOK COMPLETED');
            }
        }).catch(error => {
            console.log(error);
        });
    },
    deleteBook: (req, res) => {
        models.Book.destroy({
            where: {
                id: req.params.id
            }
        }).then(result => {
            if (result.affectedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                res.status(200).end();
            }
        }).catch(error => {
            console.error(error);
        });
    },
    addPost: (req, res) => {
        models.Book.findOne({
            where: {
                id: req.body.bookId
            }
        }).then(book => {
            return book.increment('posts', { by: 1 });
        }).catch(error => {
            console.error(error);
        });
        models.Post.create({
            body: req.body.line,
            UserId: req.body.userId,
            BookId: req.body.bookId
        }).then(result => {
            let postObj = {
                id: result.id,
                line: req.body.line,
                contributorId: req.body.userId
            }
            req.io.emit('added line: ' + req.body.bookTitle, postObj);
            res.status(200).end();
        }).catch(error => {
            console.error(error);
        });
    },
    getPosts: (req, res) => {
        let id = req.params.id;
        models.Post.findAll({
            where: {
                BookId: id
            }
        }).then(results => {
            const postsObj = {
                posts: results
            };
            console.log(postsObj);
            res.json(postsObj);
        }).catch(error => {
            console.error(error);
        });
    },
    updatePost: (req, res) => {
        let post = req.body;
        models.Post.update({
            body: post.updatedLine
        }, {
            where: {
                id: post.id
            }
        }).then(result => {
            if (result.changedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                // let postObj = {
                //     id: result.id,
                //     line: post.updatedLine
                // }
                // req.io.emit('added line: ' + req.body.bookTitle, postObj);
                res.status(200).end();
            }
        }).catch(error => {
            console.error(error);
        });
    },
    getCurrentUser: (req, res) => {
        let id = req.params.id;
        models.User.findOne({
            where: {
                id: id
            }
        }).then(result => {
            let userObj = {
                user: result
            };
            console.log(userObj);
            res.json(userObj);
        }).catch(error => {
            console.log(error);
        });
    },
    updateUser: (req, res) => {
        let user = req.body;
        models.User.update({
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            about: user.about,
            photo: user.photo,
            email: user.email
        }, {
            where: {
                id: req.params.id
            }
        }).then(result => {
            if (result.changedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                res.status(200).end();
            }
        }).catch(error => {
            console.error(error);
        });
    },
    getUsersByBook: (req, res) => {
        let id = req.params.id;
        models.Post.findAll({
            where: {
                BookId: id
            },
            include: [models.Book]
        }).then(results => {
            var userObj = [];
            // save ids to list
            let userIdList = [];
            results.forEach(post => {
                userIdList.push(post.UserId);
            });
            // loop through user list
            userIdList.forEach(id => {
                models.User.findOne({
                    where: {
                        id: id
                    }
                }).then(result => {
                    userObj.push(result);
                    if (userIdList.length === userObj.length) {
                        res.json(userObj);
                    } else {
                        return false;
                    }
                }).catch(error => {
                    console.log(error);
                });
            });
            // original call for all posts
            return false;
        }).catch(error => {
            console.log(error);
        });
    },
    userProfile: (req, res) => {
        let id = req.params.id;
        console.log(id);
        models.User.findOne({
            where: {
                id: id
            }
        }).then(results => {
            const user = results;
            models.Post.findAll({
                where: {
                    UserId: id
                },
                include: [models.Book]
            }).then(results => {
                const books = results;
                models.Book.findAll({
                    where: {
                        author: id
                    }
                }).then(results => {
                    const authoredBooks = results;
                    res.render('user-profile', {
                        loggedIn: req.isAuthenticated(),
                        title: 'User Profile',
                        books: books,
                        authoredBooks: authoredBooks,
                        user: user,
                        displayChat: true,
                        mode: darkMode(req)
                    });
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log(err);
        });
    },
    darkMode: (req, res) => {
        const mode = req.body;
        console.log('setting/unsetting dark mode');
        console.log(mode);
        const id = req.user.id;
        console.log('This: ' + mode.mode + ', id: ' + id);
        models.User.update({
            dark_mode: mode.mode
        }, {
            where: {
                id: id
            }
        }).then(result => {
            if (result.changedRows === 0) {
                // error id must not exist
                return res.status(404).end();
            } else {
                res.status(200).end();
            }
        }).catch(error => {
            console.error(error);
        });
    }

}