.PHONY: dev test lint

dev:
uvicorn main:app --reload

test:
pytest -q

lint:
python -m compileall .
