from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT / "data" / "modelo190_salarios.csv"
OUTPUT_JSON = ROOT / "docs" / "assets" / "data" / "salary-distribution.json"

NATIONAL_CCAA = "77"
NATIONAL_PROVINCE = "99"

AGE_BUCKETS: tuple[tuple[str, str, str], ...] = (
    ("lt18", "Menores de 18", "M190_8"),
    ("18_25", "18 a 25", "M190_10"),
    ("26_35", "26 a 35", "M190_12"),
    ("36_45", "36 a 45", "M190_14"),
    ("46_55", "46 a 55", "M190_16"),
    ("56_65", "56 a 65", "M190_18"),
    ("gt65", "Mayores de 65", "M190_20"),
)


@dataclass
class BucketTotals:
    salary_mass: float = 0.0
    employee_count: float = 0.0

    def add(self, salary_mass: float, employee_count: float) -> None:
        self.salary_mass += salary_mass
        self.employee_count += employee_count

    def as_dict(self) -> dict[str, float | str]:
        average_salary = 0.0
        if self.employee_count:
            average_salary = self.salary_mass / self.employee_count

        return {
            "salary_mass": round(self.salary_mass, 2),
            "employee_count": round(self.employee_count),
            "average_salary": round(average_salary, 2),
        }


def parse_decimal(raw_value: str) -> float:
    if raw_value == "NULL" or raw_value == "":
        return 0.0
    return float(raw_value.replace(".", "").replace(",", "."))


def build_dataset() -> dict[str, object]:
    yearly_totals: dict[int, dict[str, BucketTotals]] = {}

    with SOURCE_CSV.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")

        for row in reader:
            if row["CCAA"] != NATIONAL_CCAA or row["PROV"] != NATIONAL_PROVINCE:
                continue

            year = int(row["EJER"])
            year_totals = yearly_totals.setdefault(year, {})

            for bucket_key, _label, salary_column in AGE_BUCKETS:
                employee_column = f"M190_{int(salary_column.split('_')[1]) + 1}"
                bucket = year_totals.setdefault(bucket_key, BucketTotals())
                bucket.add(
                    salary_mass=parse_decimal(row[salary_column]),
                    employee_count=parse_decimal(row[employee_column]),
                )

    years = sorted(yearly_totals)
    series: list[dict[str, object]] = []

    for year in years:
        bucket_entries: list[dict[str, object]] = []
        total_employees = 0.0
        total_salary_mass = 0.0

        for bucket_key, label, _salary_column in AGE_BUCKETS:
            bucket = yearly_totals[year].get(bucket_key, BucketTotals())
            bucket_dict = bucket.as_dict()
            total_employees += bucket.employee_count
            total_salary_mass += bucket.salary_mass
            bucket_entries.append(
                {
                    "id": bucket_key,
                    "label": label,
                    **bucket_dict,
                }
            )

        average_salary = 0.0
        if total_employees:
            average_salary = total_salary_mass / total_employees

        series.append(
            {
                "year": year,
                "average_salary": round(average_salary, 2),
                "employee_count": round(total_employees),
                "salary_mass": round(total_salary_mass, 2),
                "buckets": bucket_entries,
            }
        )

    return {
        "source": {
            "dataset": "modelo190_salarios.csv",
            "scope": "España, filas agregadas CCAA=77 y PROV=99",
            "note": "La visualización se construye a partir de salarios agregados por cohorte de edad. No representa microdatos individuales ni un histograma exacto de sueldos.",
        },
        "available_years": years,
        "series": series,
    }


def main() -> None:
    dataset = build_dataset()
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(dataset, ensure_ascii=True, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
