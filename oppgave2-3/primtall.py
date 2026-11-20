def er_primtall(n):
    if n < 2:
        return False
    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True


def nte_primtall(n):
    teller = 0
    kandidat = 1
    while teller < n:
        kandidat += 1
        if er_primtall(kandidat):
            teller += 1
    return kandidat


print("Primtall nr. 10 000 er", nte_primtall(10000))
