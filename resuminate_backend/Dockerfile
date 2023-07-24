FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY app /usr/src/app

RUN pip install -r /usr/src/app/requirements.txt

RUN chmod +x /usr/src/app/start.sh
CMD ["/usr/src/app/start.sh"]