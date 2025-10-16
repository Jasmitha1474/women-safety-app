def to_float_or_none(v):
    try:
        return None if v is None else float(v)
    except Exception:
        return None
