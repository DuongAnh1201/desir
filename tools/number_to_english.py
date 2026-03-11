def number_to_english(arg: int)-> str:
    hash_check = {"1":"one", "2":"two", "3":"three", "4":"four",
"5":"five", "6":"six", "7":"seven", "8":"eight", "9":"nine", "10":"ten",
"13":"thirteen", "15":"fifteen",
"20":"twenty", "30":"thirty", "40":"forty", "50":"fifty",
"60":"sixty", "70":"seventy", "80":"eighty", "90":"ninety" }
    def _helper_3numbers(string: str) -> str:
        res = ""
        if string[0] != "0":
            res += (hash_check[string[0]] + " hundred")
        if string[1] != "0":
            if string[1:3] in hash_check:
                res += " " + (hash_check[string[1:3]])
                return res
            tens = string[1] + "0"
            digit = string[2]
            res += (" " + hash_check[tens]) + (" "+ hash_check[digit])
            return res
        if string[2] != "0":
            return res + (hash_check[string[2]])
        return ""

    string = str(arg)
    n = len(string)
    string = "0"*(9-n) + string
    res = ""
    if _helper_3numbers(string[0:3]) != "":
        res += _helper_3numbers(string[0:3]) + " million and "
    if _helper_3numbers(string[3:6]) != "":
        res += _helper_3numbers(string[3:6]) + " thousand and "
    if _helper_3numbers(string[6:9]) != "":
        res += _helper_3numbers(string[6:9])
    print(string)
    return res

n = 15150
print(n)
print(number_to_english(n))




            
            
        