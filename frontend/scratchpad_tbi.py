# Usage: 
# tbi_params = await fetchTBIParams();

# TBI Calculation Logic (derived from PHP plugin)
import math

def calculate_pmt(rate, nper, pv):
    # rate: annual interest rate / 12 (monthly)
    # nper: number of months
    # pv: present value (generating negative PMT usually, so minus)
    if rate == 0:
        return -pv / nper
    
    # Formula: PMT = (PV * rate) / (1 - (1 + rate)^-nper)
    # detailed php: (-$fv - $pv * pow(1 + $rate, $nper)) / (1 + $rate * $type) / ((pow(1 + $rate, $nper) - 1) / $rate);
    # distinct from Excel PMT?
    # PHP code:
    # return (-$fv - $pv * pow(1 + $rate, $nper)) / (1 + $rate * $type) / ((pow(1 + $rate, $nper) - 1) / $rate);
    # fv=0, type=0.
    # -> ( -pv * (1+r)^n ) / ( ((1+r)^n - 1) / r )
    # -> -pv * r * (1+r)^n / ((1+r)^n - 1)
    # This is standard annuity formula.
    return (pv * rate) / (1 - (1 + rate)**(-nper))
