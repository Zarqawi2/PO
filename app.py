from po_app import create_app
from po_app.config import FLASK_DEBUG, FLASK_USE_RELOADER, HOST, PORT

app = create_app()


def main():
    app.run(
        host=HOST,
        port=PORT,
        debug=FLASK_DEBUG,
        use_reloader=FLASK_USE_RELOADER,
    )


if __name__ == "__main__":
    main()
