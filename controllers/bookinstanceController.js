const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const async = require("async");
const { body, validationResult } = require("express-validator");
const { DateTime } = require("luxon");

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
  .populate("book")
  .exec(function (err, list_bookinstances) {
    if (err) next(err);

    res.render("bookinstance_list", {
      title: "Book Instance List",
      bookinstance_list: list_bookinstances
    })
  })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
  .populate("book")
  .exec((err, bookinstance) => {
    if (err) return next(err);

    if (bookinstance == null) {
      const err = new Error("Book copy not found");
      err.status = 404;
      return next(err);
    }

    res.render("bookinstance_detail", {
      title: `Copy: ${bookinstance.book.title}`,
      bookinstance
    })
  })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) return next(err);

    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified")
  .trim()
  .isLength({ min: 1 })
  .escape(),

  body("imprint", "Imprint must be specified")
  .trim()
  .isLength({ min: 1 })
  .escape(),

  body("status").escape(),

  body("due_back")
  .custom((value, { req }) => {
    if (req.body.status!='Available' && !value) {
      throw new Error("Due back date required");
    }

    else {
      return body("due_back").isISO8601().toDate();
      // return body("due_back").isISO8601();
    }
  }),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error menssages.
      // Book.find({}, "title").exec((err, books) => {
      Book.find().exec((err, books) => {
        if (err) return next(err);

        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          bookinstance,
          errors: errors.array()
        });
      });

      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) return next(err);

      // Successful: redirect to new record
      res.redirect(bookinstance.url);
    })
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
  .populate("book")
  .exec((err, bookinstance) => {
    if (err) return next(err);

    if(bookinstance===null) {
      res.redirect("/catalog/bookinstances")
    }

    res.render("bookinstance_delete", {
      title: "Delete ID",
      bookinstance
    })
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findById(req.body.bookinstanceid)
  .populate("book")
  .exec((err, bookinstance) => {
    if (err) return next(err);

    // Author has no books. Delete object and redirect to the list of authors.
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
      if (err) return next(err);

      // Success - go to author list.
      res.redirect("/catalog/bookinstances");
    })
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id)
        .populate("book")
        .exec(callback);
      },
      books(callback) {
        Book.find({}, "title")
        .exec(callback);
      }
    },
    (err, results) => {
      if (err) return next(err);

      if (results.bookinstance == null) {
        const err = new Error("Bookinstance not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: results.books,
        bookinstance: results.bookinstance,
        selected_book: results.bookinstance.book._id,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified")
  .trim()
  .isLength({ min: 1 })
  .escape(),

  body("imprint", "Imprint must be specified")
  .trim()
  .isLength({ min: 1 })
  .escape(),

  body("status").escape(),

  body("due_back")
  .custom((value, { req }) => {
    if (req.body.status!='Available' && !value) {
      throw new Error("Due back date required");
    }

    else {
      return body("due_back").isISO8601().toDate()
      // return body("due_back").isISO8601();
    }
  }),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          books(callback) {
            Book.find({}, "title")
            .exec(callback);
          }
        },
        (err, results) => {
          if (err) return next(err);

          res.render("bookinstance_form", {
            title: "Update BookInstance",
            book_list: results.books,
            bookinstance,
            errors: errors.array()
          });
        }
      );

      return;
    }

    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
      if (err) return next(err);

      res.redirect(thebookinstance.url);
    })
  }
];
