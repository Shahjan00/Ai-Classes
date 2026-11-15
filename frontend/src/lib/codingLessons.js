// Coding Lab lessons: 8 per class, Classes 6 to 12, in order.
// Each lesson is one small, runnable Python program. `code` is the starter
// code (a correct solution the student can run, break and fix), `test` is
// the exact stdout it must produce to pass. Every starter program was
// executed through real Python and its output checked against `test`
// before this file was written. The first lesson of Classes 6 to 9 keeps
// the original py1-py4 ids so existing progress is not lost.
export const CODING_CLASSES = [6, 7, 8, 9, 10, 11, 12];

export const CODING_LESSONS = [
  // ---------- Class 6: first steps ----------
  {
    id: 'py1', cls: 6, title: 'Your first print',
    goal: 'Print "Hello, JARVISH" to the screen.',
    code: 'print("Hello, JARVISH")',
    test: 'Hello, JARVISH',
    hint: 'print() shows text on the screen. Put your words in quotes.',
  },
  {
    id: 'c6-2', cls: 6, title: 'Print your name',
    goal: 'Print a sentence with your name in it.',
    code: 'print("My name is Asha")',
    test: 'My name is Asha',
    hint: 'print() can show a whole sentence. Keep it inside the quotes.',
  },
  {
    id: 'c6-3', cls: 6, title: 'A number in a box',
    goal: 'Store 11 in a variable called age, then print it.',
    code: 'age = 11\nprint(age)',
    test: '11',
    hint: 'A variable is a named box. age = 11 puts 11 in the box called age.',
  },
  {
    id: 'c6-4', cls: 6, title: 'Add two numbers',
    goal: 'Add 5 and 7 and print the answer.',
    code: 'a = 5\nb = 7\nprint(a + b)',
    test: '12',
    hint: 'The + sign adds numbers, just like in maths class.',
  },
  {
    id: 'c6-5', cls: 6, title: 'Total price',
    goal: 'One notebook costs 10 rupees. What do 3 cost? Print the total.',
    code: 'price = 10\nqty = 3\nprint(price * qty)',
    test: '30',
    hint: 'The * sign multiplies. Total = price times quantity.',
  },
  {
    id: 'c6-6', cls: 6, title: 'Join two words',
    goal: 'Join "Good" and "morning" with a space and print the result.',
    code: 'first = "Good"\nsecond = "morning"\nprint(first + " " + second)',
    test: 'Good morning',
    hint: 'The + sign also joins text. Add " " in the middle for the space.',
  },
  {
    id: 'c6-7', cls: 6, title: 'Repeat a word',
    goal: 'Print "star" three times in a row, with no spaces.',
    code: 'word = "star"\nprint(word * 3)',
    test: 'starstarstar',
    hint: 'Multiplying text repeats it. "star" * 3 makes it three times.',
  },
  {
    id: 'c6-8', cls: 6, title: 'Pass or fail',
    goal: 'If marks are above 40, print "Pass". Try marks = 85.',
    code: 'marks = 85\nif marks > 40:\n    print("Pass")',
    test: 'Pass',
    hint: 'if checks a condition. The indented line runs only when it is true.',
  },

  // ---------- Class 7: numbers and choices ----------
  {
    id: 'py2', cls: 7, title: 'Maths with variables',
    goal: 'Add two numbers and print the total.',
    code: 'a = 12\nb = 8\nprint(a + b)',
    test: '20',
    hint: 'Variables hold numbers. print(a + b) shows their sum.',
  },
  {
    id: 'c7-2', cls: 7, title: 'Average of two numbers',
    goal: 'Find the average of 10 and 20 and print it.',
    code: 'a = 10\nb = 20\nprint((a + b) / 2)',
    test: '15.0',
    hint: 'Average is (a + b) / 2. The brackets matter, do the sum first.',
  },
  {
    id: 'c7-3', cls: 7, title: 'What is left over?',
    goal: '17 sweets shared by 5 friends. How many are left over? Print it.',
    code: 'print(17 % 5)',
    test: '2',
    hint: '% is the remainder operator. 17 % 5 is what is left after sharing.',
  },
  {
    id: 'c7-4', cls: 7, title: 'Square a number',
    goal: 'Print the square of 9 (9 times 9).',
    code: 'n = 9\nprint(n * n)',
    test: '81',
    hint: 'A square is a number times itself. n * n does it.',
  },
  {
    id: 'c7-5', cls: 7, title: 'Say it nicely',
    goal: 'Print "Ravi is 12" using an f-string with name and age.',
    code: 'name = "Ravi"\nage = 12\nprint(f"{name} is {age}")',
    test: 'Ravi is 12',
    hint: 'An f-string lets you drop variables into text with {curly braces}.',
  },
  {
    id: 'c7-6', cls: 7, title: 'Which is bigger?',
    goal: 'Print the bigger of 15 and 9.',
    code: 'a = 15\nb = 9\nif a > b:\n    print(a)\nelse:\n    print(b)',
    test: '15',
    hint: 'if picks one branch, else picks the other. Only one print runs.',
  },
  {
    id: 'c7-7', cls: 7, title: 'Count to 3',
    goal: 'Print 1, 2, 3, one per line, using a loop.',
    code: 'for i in range(1, 4):\n    print(i)',
    test: '1\n2\n3',
    hint: 'range(1, 4) gives 1, 2, 3. The loop prints each one.',
  },
  {
    id: 'c7-8', cls: 7, title: 'Even or odd',
    goal: 'Check whether 8 is even or odd and print the word.',
    code: 'n = 8\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
    test: 'even',
    hint: 'An even number leaves 0 when divided by 2. n % 2 == 0 tests that.',
  },

  // ---------- Class 8: loops and lists ----------
  {
    id: 'py3', cls: 8, title: 'A loop that counts',
    goal: 'Print the numbers 1 to 5, one per line.',
    code: 'for i in range(1, 6):\n    print(i)',
    test: '1\n2\n3\n4\n5',
    hint: 'range(1, 6) gives 1, 2, 3, 4, 5. The loop repeats print for each.',
  },
  {
    id: 'c8-2', cls: 8, title: 'Add 1 to 10',
    goal: 'Add all the numbers from 1 to 10 and print the total.',
    code: 'total = 0\nfor i in range(1, 11):\n    total = total + i\nprint(total)',
    test: '55',
    hint: 'Start total at 0, then add each number to it inside the loop.',
  },
  {
    id: 'c8-3', cls: 8, title: 'Times table',
    goal: 'Print the first 3 multiples of 3 (3, 6, 9), one per line.',
    code: 'n = 3\nfor i in range(1, 4):\n    print(n * i)',
    test: '3\n6\n9',
    hint: 'Multiply n by i each time round the loop: 3x1, 3x2, 3x3.',
  },
  {
    id: 'c8-4', cls: 8, title: 'First fruit',
    goal: 'Make a list of three fruits and print the first one.',
    code: 'fruits = ["apple", "banana", "mango"]\nprint(fruits[0])',
    test: 'apple',
    hint: 'A list holds many values. Counting starts at 0, so [0] is the first.',
  },
  {
    id: 'c8-5', cls: 8, title: 'How many marks?',
    goal: 'Count how many marks are in the list and print the count.',
    code: 'marks = [10, 20, 30, 40]\nprint(len(marks))',
    test: '4',
    hint: 'len() tells you how many items a list has.',
  },
  {
    id: 'c8-6', cls: 8, title: 'Count with while',
    goal: 'Print 1, 2, 3 using a while loop.',
    code: 'n = 1\nwhile n <= 3:\n    print(n)\n    n = n + 1',
    test: '1\n2\n3',
    hint: 'while repeats as long as its condition is true. Do not forget n = n + 1.',
  },
  {
    id: 'c8-7', cls: 8, title: 'Count the vowels',
    goal: 'Count the vowels (a, e, i, o, u) in "banana" and print the count.',
    code: 'word = "banana"\ncount = 0\nfor ch in word:\n    if ch in "aeiou":\n        count = count + 1\nprint(count)',
    test: '3',
    hint: 'Loop over each letter. `ch in "aeiou"` is true only for vowels.',
  },
  {
    id: 'c8-8', cls: 8, title: 'Shopping total',
    goal: 'Add up the prices [20, 35, 15] and print the total bill.',
    code: 'prices = [20, 35, 15]\nprint(sum(prices))',
    test: '70',
    hint: 'sum() adds up every number in a list in one go.',
  },

  // ---------- Class 9: functions and data ----------
  {
    id: 'py4', cls: 9, title: 'A function that doubles',
    goal: 'Write a function double(x) that returns twice x, then print double(7).',
    code: 'def double(x):\n    return x * 2\n\nprint(double(7))',
    test: '14',
    hint: 'def makes a function. return sends the answer back.',
  },
  {
    id: 'c9-2', cls: 9, title: 'Area of a rectangle',
    goal: 'Write a function area(l, w) that returns l times w, then print area(5, 4).',
    code: 'def area(l, w):\n    return l * w\n\nprint(area(5, 4))',
    test: '20',
    hint: 'A function can take two inputs. area(5, 4) means l=5, w=4.',
  },
  {
    id: 'c9-3', cls: 9, title: 'Is it prime?',
    goal: 'Check whether 7 is prime and print "prime" or "not prime".',
    code: 'n = 7\nis_prime = True\nfor i in range(2, n):\n    if n % i == 0:\n        is_prime = False\nif is_prime:\n    print("prime")\nelse:\n    print("not prime")',
    test: 'prime',
    hint: 'A prime has no divisors except 1 and itself. Test every i from 2 to n-1.',
  },
  {
    id: 'c9-4', cls: 9, title: 'Say it backwards',
    goal: 'Print "code" backwards.',
    code: 'word = "code"\nprint(word[::-1])',
    test: 'edoc',
    hint: '[::-1] slices a string backwards, last letter first.',
  },
  {
    id: 'c9-5', cls: 9, title: 'How many words?',
    goal: 'Count the words in "learn python every day" and print the count.',
    code: 'sentence = "learn python every day"\nprint(len(sentence.split()))',
    test: '4',
    hint: 'split() breaks a sentence into a list of words. len() counts them.',
  },
  {
    id: 'c9-6', cls: 9, title: 'Biggest number',
    goal: 'Find the biggest number in [4, 9, 2, 7] and print it.',
    code: 'nums = [4, 9, 2, 7]\nprint(max(nums))',
    test: '9',
    hint: 'max() picks the largest value in a list.',
  },
  {
    id: 'c9-7', cls: 9, title: 'Marks book',
    goal: 'Look up Ravi in the marks dictionary and print his marks.',
    code: 'marks = {"Asha": 85, "Ravi": 92}\nprint(marks["Ravi"])',
    test: '92',
    hint: 'A dictionary maps keys to values. marks["Ravi"] gives 92.',
  },
  {
    id: 'c9-8', cls: 9, title: 'Fizz for 3',
    goal: 'Print 1 to 5, but print "Fizz" instead of numbers divisible by 3.',
    code: 'for i in range(1, 6):\n    if i % 3 == 0:\n        print("Fizz")\n    else:\n        print(i)',
    test: '1\n2\nFizz\n4\n5',
    hint: 'i % 3 == 0 means i divides by 3 exactly. Print Fizz then, else i.',
  },

  // ---------- Class 10: strings and lists, deeper ----------
  {
    id: 'c10-1', cls: 10, title: 'Add the digits',
    goal: 'Add the digits of 123 (1 + 2 + 3) and print the total.',
    code: 'n = 123\ntotal = 0\nfor d in str(n):\n    total = total + int(d)\nprint(total)',
    test: '6',
    hint: 'str(n) turns 123 into "123". Loop over its characters, int() each one.',
  },
  {
    id: 'c10-2', cls: 10, title: 'Palindrome check',
    goal: 'Check whether "madam" reads the same backwards and print the result.',
    code: 'word = "madam"\nif word == word[::-1]:\n    print("palindrome")\nelse:\n    print("not palindrome")',
    test: 'palindrome',
    hint: 'A palindrome equals its own reverse. Compare word with word[::-1].',
  },
  {
    id: 'c10-3', cls: 10, title: 'Factorial of 5',
    goal: 'Write a function fact(n) and print fact(5), which is 5x4x3x2x1.',
    code: 'def fact(n):\n    r = 1\n    for i in range(1, n + 1):\n        r = r * i\n    return r\n\nprint(fact(5))',
    test: '120',
    hint: 'Multiply r by every number from 1 to n, then return r.',
  },
  {
    id: 'c10-4', cls: 10, title: 'Sort the list',
    goal: 'Sort [5, 2, 8, 1] from smallest to largest and print it.',
    code: 'nums = [5, 2, 8, 1]\nnums.sort()\nprint(nums)',
    test: '[1, 2, 5, 8]',
    hint: 'sort() rearranges a list in place, smallest first.',
  },
  {
    id: 'c10-5', cls: 10, title: 'How many different?',
    goal: 'Count how many different numbers are in [1, 2, 2, 3, 3, 3].',
    code: 'nums = [1, 2, 2, 3, 3, 3]\nprint(len(set(nums)))',
    test: '3',
    hint: 'A set keeps only one copy of each value. len() counts what is left.',
  },
  {
    id: 'c10-6', cls: 10, title: 'Squares list',
    goal: 'Build a list of the squares of 1, 2, 3, 4 and print it.',
    code: 'squares = []\nfor i in range(1, 5):\n    squares.append(i * i)\nprint(squares)',
    test: '[1, 4, 9, 16]',
    hint: 'append() adds one item to the end of a list.',
  },
  {
    id: 'c10-7', cls: 10, title: 'Count the a’s',
    goal: 'Count how many times "a" appears in ["a", "b", "a", "c", "a"].',
    code: 'words = ["a", "b", "a", "c", "a"]\nprint(words.count("a"))',
    test: '3',
    hint: 'list.count(x) tells you how many times x appears.',
  },
  {
    id: 'c10-8', cls: 10, title: 'Fibonacci five',
    goal: 'Print the first 5 Fibonacci numbers: 0, 1, 1, 2, 3.',
    code: 'a, b = 0, 1\nfor _ in range(5):\n    print(a)\n    a, b = b, a + b',
    test: '0\n1\n1\n2\n3',
    hint: 'Each new number is the sum of the two before it. a, b = b, a + b steps forward.',
  },

  // ---------- Class 11: algorithms ----------
  {
    id: 'c11-1', cls: 11, title: 'Binary search',
    goal: 'Find 8 in the sorted list [2, 5, 8, 12, 16] with binary search and print its position.',
    code: 'def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\nprint(search([2, 5, 8, 12, 16], 8))',
    test: '2',
    hint: 'Check the middle. Too small? Search the right half. Too big? The left half.',
  },
  {
    id: 'c11-2', cls: 11, title: 'Vowels in a sentence',
    goal: 'Count the vowels in "hello world" and print the count.',
    code: 's = "hello world"\nv = 0\nfor ch in s:\n    if ch in "aeiou":\n        v += 1\nprint(v)',
    test: '3',
    hint: 'Same trick as Class 8, now on a whole sentence with a space in it.',
  },
  {
    id: 'c11-3', cls: 11, title: 'Second largest',
    goal: 'Find the second largest number in [4, 9, 2, 9, 7] and print it.',
    code: 'nums = [4, 9, 2, 9, 7]\nuniq = sorted(set(nums))\nprint(uniq[-2])',
    test: '7',
    hint: 'set() removes the duplicate 9, sorted() orders them, [-2] is second from the end.',
  },
  {
    id: 'c11-4', cls: 11, title: 'Anagram check',
    goal: 'Check whether "listen" and "silent" use the same letters and print True or False.',
    code: 'a = "listen"\nb = "silent"\nprint(sorted(a) == sorted(b))',
    test: 'True',
    hint: 'Two words are anagrams if their sorted letters match exactly.',
  },
  {
    id: 'c11-5', cls: 11, title: 'Class average',
    goal: 'Find the average of marks [80, 90, 70, 85] and print it.',
    code: 'marks = [80, 90, 70, 85]\nprint(sum(marks) / len(marks))',
    test: '81.25',
    hint: 'Average is the total divided by how many there are.',
  },
  {
    id: 'c11-6', cls: 11, title: 'Add two matrices',
    goal: 'Add [[1, 2], [3, 4]] and [[5, 6], [7, 8]] and print the result.',
    code: 'a = [[1, 2], [3, 4]]\nb = [[5, 6], [7, 8]]\nc = [[a[i][j] + b[i][j] for j in range(2)] for i in range(2)]\nprint(c)',
    test: '[[6, 8], [10, 12]]',
    hint: 'Add matching positions: c[i][j] = a[i][j] + b[i][j].',
  },
  {
    id: 'c11-7', cls: 11, title: 'Count down, recursively',
    goal: 'Write a recursive function count(n) that prints 3, 2, 1.',
    code: 'def count(n):\n    if n == 0:\n        return\n    print(n)\n    count(n - 1)\n\ncount(3)',
    test: '3\n2\n1',
    hint: 'A recursive function calls itself with a smaller n, and stops at 0.',
  },
  {
    id: 'c11-8', cls: 11, title: 'Add up a CSV',
    goal: 'Add the marks in "Asha,85" and "Ravi,92" and print the total.',
    code: 'data = "Asha,85\\nRavi,92"\ntotal = 0\nfor line in data.split("\\n"):\n    total += int(line.split(",")[1])\nprint(total)',
    test: '177',
    hint: 'Split each line on the comma, take part [1], turn it into a number.',
  },

  // ---------- Class 12: data structures and OOP ----------
  {
    id: 'c12-1', cls: 12, title: 'Bubble sort',
    goal: 'Sort [5, 2, 8, 1] with bubble sort and print the sorted list.',
    code: 'nums = [5, 2, 8, 1]\nfor i in range(len(nums)):\n    for j in range(len(nums) - 1):\n        if nums[j] > nums[j + 1]:\n            nums[j], nums[j + 1] = nums[j + 1], nums[j]\nprint(nums)',
    test: '[1, 2, 5, 8]',
    hint: 'Compare neighbours and swap them if they are in the wrong order. Repeat.',
  },
  {
    id: 'c12-2', cls: 12, title: 'A stack of plates',
    goal: 'Push 10, 20, 30 onto a stack, pop one off, and print what you popped and what is left.',
    code: 'stack = []\nstack.append(10)\nstack.append(20)\nstack.append(30)\nprint(stack.pop())\nprint(stack)',
    test: '30\n[10, 20]',
    hint: 'A stack is last-in, first-out. pop() takes the top item off.',
  },
  {
    id: 'c12-3', cls: 12, title: 'Your first class',
    goal: 'Make a Student class with a name and marks, then print them for Asha, 85.',
    code: 'class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\ns = Student("Asha", 85)\nprint(s.name, s.marks)',
    test: 'Asha 85',
    hint: '__init__ runs when you make the object. self keeps the values on it.',
  },
  {
    id: 'c12-4', cls: 12, title: 'Primes up to 10',
    goal: 'Collect all the prime numbers from 2 to 10 into a list and print it.',
    code: 'primes = []\nfor n in range(2, 11):\n    ok = True\n    for i in range(2, n):\n        if n % i == 0:\n            ok = False\n    if ok:\n        primes.append(n)\nprint(primes)',
    test: '[2, 3, 5, 7]',
    hint: 'Test each n for divisors from 2 to n-1. Keep it only if none divide it.',
  },
  {
    id: 'c12-5', cls: 12, title: 'Merge two dictionaries',
    goal: 'Merge {"y": 3, "z": 4} into {"x": 1, "y": 2} and print the result.',
    code: 'a = {"x": 1, "y": 2}\nb = {"y": 3, "z": 4}\na.update(b)\nprint(a)',
    test: "{'x': 1, 'y': 3, 'z': 4}",
    hint: 'update() copies the second dictionary in. Shared keys take the new value.',
  },
  {
    id: 'c12-6', cls: 12, title: 'Sort students by marks',
    goal: 'Sort students by marks, lowest first, and print just their names in order.',
    code: 'students = [("Ravi", 92), ("Asha", 85), ("Meena", 95)]\nstudents.sort(key=lambda s: s[1])\nprint([s[0] for s in students])',
    test: "['Asha', 'Ravi', 'Meena']",
    hint: 'key=lambda s: s[1] tells sort to compare the marks (position 1), not the name.',
  },
  {
    id: 'c12-7', cls: 12, title: 'Greatest common divisor',
    goal: 'Write a gcd(a, b) function with Euclid’s method and print gcd(48, 18).',
    code: 'def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\nprint(gcd(48, 18))',
    test: '6',
    hint: 'Replace (a, b) with (b, a % b) until b is 0. What is left in a is the gcd.',
  },
  {
    id: 'c12-8', cls: 12, title: 'A queue with deque',
    goal: 'Make a queue [1, 2, 3], add 4 at the back, take one off the front, and print both results.',
    code: 'from collections import deque\nq = deque([1, 2, 3])\nq.append(4)\nprint(q.popleft())\nprint(list(q))',
    test: '1\n[2, 3, 4]',
    hint: 'A queue is first-in, first-out. popleft() takes from the front.',
  },
];

export function lessonsForClass(cls) {
  return CODING_LESSONS.filter((l) => l.cls === cls);
}

export function nextLessonAfter(id) {
  const i = CODING_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < CODING_LESSONS.length ? CODING_LESSONS[i + 1] : null;
}
