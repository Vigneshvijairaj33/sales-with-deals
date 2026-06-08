"""
AI Scoring logic — Value Score computation and Fake Discount detection.
Implemented here as pure functions so they are easily unit/property tested.
"""
import numpy as np
from typing import List


def compute_p90(prices: List[float]) -> float:
    """Return the 90th percentile of a price list."""
    if not prices:
        return 0.0
    return float(np.percentile(prices, 90))


def compute_median(prices: List[float]) -> float:
    """Return the median of a price list."""
    if not prices:
        return 0.0
    return float(np.median(prices))


def price_percentile_rank(current_price: float, prices: List[float]) -> float:
    """
    Return the fraction of historical prices that are >= current_price.
    A lower current price → higher rank (closer to 1.0).
    """
    if not prices:
        return 0.5
    count_above = sum(1 for p in prices if p >= current_price)
    return count_above / len(prices)


def compute_score(req) -> object:
    """
    Compute Value_Score, fake_discount_flag, and low_confidence_score.

    value_score formula:
        genuine_discount_pct = (median_90d - current_price) / median_90d  clamped to [0,1]
        price_vs_history_percentile = fraction of history >= current_price
        category_rank = category_avg_discount (already normalized 0-1)
        raw = genuine_discount_pct * 0.6 + price_vs_history_percentile * 0.3 + category_rank * 0.1
        value_score = int(round(clamp(raw, 0, 1) * 100))
    """
    prices = [entry.price for entry in req.price_history]
    unique_days = len(set(entry.recorded_at[:10] for entry in req.price_history))

    low_confidence = unique_days < 7

    # Fake discount: original_price inflated above p90 of history
    fake_discount = False
    if prices:
        p90 = compute_p90(prices)
        fake_discount = req.original_price > p90

    # Value score
    if prices:
        median_90d = compute_median(prices)
        if median_90d > 0:
            genuine_discount = max(0.0, (median_90d - req.current_price) / median_90d)
        else:
            genuine_discount = 0.0
        pct_rank = price_percentile_rank(req.current_price, prices)
    else:
        genuine_discount = 0.0
        pct_rank = 0.5

    category_rank = max(0.0, min(1.0, req.category_avg_discount))
    raw = genuine_discount * 0.6 + pct_rank * 0.3 + category_rank * 0.1
    value_score = int(round(max(0.0, min(1.0, raw)) * 100))

    # Import here to avoid circular dependency in tests
    from main import ScoringResponse
    return ScoringResponse(
        value_score=value_score,
        fake_discount_flag=fake_discount,
        low_confidence_score=low_confidence,
    )
