import pytest
from app.services.parser.ast_parser import ast_parser
from app.models.schemas import SymbolType

JAVA_SAMPLE = """
package com.example.demo;

public class OrderService {
    private final PaymentClient paymentClient;

    public OrderService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }

    public Order processOrder(OrderRequest request) {
        return paymentClient.charge(request);
    }
}
"""

PYTHON_SAMPLE = """
from typing import Optional

class UserService:
    def __init__(self, db):
        self.db = db

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return self.db.find(user_id)

def calculate_tax(amount: float) -> float:
    return amount * 0.1
"""

def test_parse_java_symbols():
    symbols = ast_parser.parse_file(JAVA_SAMPLE, "java")
    names = [s.name for s in symbols]
    assert "OrderService" in names
    
    class_sym = next(s for s in symbols if s.name == "OrderService")
    assert class_sym.symbol_type == SymbolType.CLASS
    assert class_sym.start_line == 4

def test_parse_python_symbols():
    symbols = ast_parser.parse_file(PYTHON_SAMPLE, "python")
    names = [s.name for s in symbols]
    assert "UserService" in names
    assert "get_user_by_id" in names
    assert "calculate_tax" in names

    tax_fn = next(s for s in symbols if s.name == "calculate_tax")
    assert tax_fn.symbol_type == SymbolType.FUNCTION
