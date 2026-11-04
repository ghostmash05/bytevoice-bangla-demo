import unittest

from agent.validation import normalize_bd_mobile, normalize_reference


class PhoneValidationTests(unittest.TestCase):
    def test_bangla_digits(self):
        self.assertEqual(normalize_bd_mobile("০১৭১২৩৪৫৬৭৮"), "+8801712345678")

    def test_international_formats_and_separators(self):
        for phone in ("01712-345678", "+880 1712 345678", "8801712345678"):
            with self.subTest(phone=phone):
                self.assertEqual(normalize_bd_mobile(phone), "+8801712345678")

    def test_rejects_malformed_input_without_guessing(self):
        for phone in ("0171234567", "017123456789", "01212345678", "phone01712345678", "++8801712345678", ""):
            with self.subTest(phone=phone), self.assertRaises(ValueError):
                normalize_bd_mobile(phone)

    def test_booking_references_accept_bangla_digits_and_optional_prefix(self):
        for reference in ("১২৩৪৫৬৭৮", "1234 5678", "ddc-12345678", "DDC12345678"):
            with self.subTest(reference=reference):
                self.assertEqual(normalize_reference(reference), "DDC-12345678")
        self.assertEqual(normalize_reference("DDC-827D6627"), "DDC-827D6627")

    def test_malformed_reference_is_not_guessed(self):
        for reference in ("12345", "DDC-123456789", "DDC-1234567Z"):
            with self.subTest(reference=reference), self.assertRaises(ValueError):
                normalize_reference(reference)


if __name__ == "__main__":
    unittest.main()
