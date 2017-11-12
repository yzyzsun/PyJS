/**
 * Created by yzyzsun on 2017/1/3.
 */

require('skeleton-css/css/normalize.css');
require('skeleton-css/css/skeleton.css');
require('codemirror/lib/codemirror.css');
require('codemirror/theme/solarized.css');

const CodeMirror = require('codemirror');
require('codemirror/mode/python/python');
const interpreter = require('./src/interpreter').interpreter;

const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
  mode: 'python',
  theme: 'solarized dark',
  indentUnit: 4,
  indentWithTabs: true,
  lineNumbers: true,
  viewportMargin: Infinity,
});

const element = document.getElementsByClassName('CodeMirror')[0];
element.style.fontFamily = 'Monaco, Consolas, monospace';
element.style.fontSize = '14px';
element.style.height = 'auto';

document.getElementById('run').onclick = () => {
  const source = editor.getValue();
  const output = document.getElementById('output');
  if (source.search(/\S/) === -1) {
    output.textContent = '';
    return;
  }
  try {
    interpreter.interpret(source);
    output.textContent = interpreter.output;
  } catch (e) {
    output.textContent = e.toString();
  }
};

document.getElementById('grammar').textContent = require('raw-loader!./grammar.txt');

const exampleCode = (id, code) => {
  document.getElementById(id).onclick = () => editor.setValue(code);
};

exampleCode('example1',
`a = 0b11111111
b = 0o377
c = 0xff
d = 255
print(a, b, c, d)

e = 9e-2
f = -1.50
print(e, f)

string = 'This\\tis a\\ntest of \\
string.\\\\'
print(string)

print(None, True, False)

l = [1, 2, 3, 4]
d = {1: 2, 3: 4}
s = {1, 2, 3, 4}
print(type(l), type(d), type(s))`
);
exampleCode('example2',
`# Arithmetic operation
print(1 + 2 * (3 + 4) % 5 - 6)

# Exponentiation
print(2 ** 3 ** 3)

# Bitwise operation
print(0x12 << 24 | 0b00110100 << 16 | 0o2547 << 4 | 8)

# Boolean operation
print(not (1 < 2 and 3 >= 4 or 5 != 5))

# String concatenation
print('hello' + ',' + 'world' + '!' * 3)

# Comparison
print(1.0 == True, 'alpha' < 'beta', [2, 3] > [2, 2])
print({1} == {2}, {1} < {2}, {1} > {2}, {1} < {1, 2})

# Conditional expression
print('YES' if False else 'NO')`
);
exampleCode('example3',
`# List
l = [5, 4, 3, 2, 1]
l[4] = 10
del l[1]
l.append(6)
print(l)
l.sort()
l.reverse()
print(l)
print(10 in l)

# Dict
d = {1: 2, 3: 4, 's': 't'}
d[1] = 10
d[5] = 6
del d[3]
print(d)

# Set
s = {1, 2, 3}
s.discard(1)
s.add(3)
s.add(4)
print(s)
print(2 in s)`
);
exampleCode('example4',
`score = 72
if score >= 90:
	grade = 'A'
elif score >= 80:
	grade = 'B'
elif score >= 70:
	grade = 'C'
elif score >= 60:
	grade = 'D'
else:
	grade = 'F'
print('Grade is ' + grade)

a = 10
b = 10
if a == b:
	a += 5
	b -= 5
	if a + b == 20:
		a //= 2
		b **= 2
	else:
		a = b = 0
if a == 7 and b == 25:
	print('OK')`
);
exampleCode('example5',
`# For loop of str
for c in 'hi': print(c)

# For loop of list
l = [None, 48, 3.14, 'apple', 'pen']
for i in l: print(i)

# For loop of range
for i in range(1, 5): print(i)

# While loop
a = 323
b = 68
while b != 0:
	t = a % b
	a = b
	b = t
else:
	print('b is zero')
print(a)`
);
exampleCode('example6',
`# Recursion
def factorial(n):
	if n == 0:
		return 1
	else:
		return n * factorial(n - 1)
print(factorial(10))

# Map
def exp(x): return x ** x
mapped = map(exp, [1, 2, 3, 4])
print(mapped)

# Filter
def odd(x): return x % 2 == 1
filtered = filter(odd, [1, 2, 3, 4])
print(filtered)

# Other built-in functions
print(abs(-1), round(3.8), chr(97), ord('a'), len([1, 2, 3]))
print(sum([1, 2, 3]), max(1, 2, 3), min(1, 2, 3))`
);
exampleCode('example7',
`class Parent:

	id = 0

	def __init__(self, k):
		print("I'm parent.")
		self.id = k

	def update(self, num):
		self.id = self.id + num

	def get(self):
		return self.id

class Child(Parent):

	def __init__(self, k):
		print("I'm child.")
		self.id = k

	def update(self, num):
		self.id = self.id * num

parent = Parent(5)
parent.update(2)
print(parent.get())

child = Child(5)
child.update(2)
print(child.get())

print(Child.id)`
);
exampleCode('clear', '');
