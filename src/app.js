/**
 * Created by yzyzsun on 2017/1/3.
 */

require('skeleton-css/css/normalize.css');
require('skeleton-css/css/skeleton.css');
require('codemirror/lib/codemirror.css');
require('codemirror/theme/solarized.css');

const CodeMirror = require('codemirror');
require('codemirror/mode/python/python');
const interpreter = require('./interpreter').interpreter;

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
    output.textContent = e.name + ': ' + e.message;
  }
};

document.getElementById('grammar').textContent = require('raw-loader!../docs/grammar.txt');

const exampleCode = (id, code) => {
  document.getElementById(id).onclick = () => editor.setValue(code);
};

exampleCode('example1',
`integer_a = 0b11111111
integer_b = 0o377
integer_c = 0xff
integer_d = 255
print(integer_a)
print(integer_b)
print(integer_c)
print(integer_d)

float_a = -1.50
float_b = 9e-2
print(float_a)
print(float_b)

string = 'This\\tis a\\ntest of \\\nstring.\\\\'
print(string)`
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
print('hello' + ', ' + 'world' + '!' * 3)`
);
exampleCode('example3',
`score = 72
teacher_angry = False
if score >= 90 and not teacher_angry:
	grade = 'A'
elif score >= 80 and not teacher_angry:
	grade = 'B'
elif score >= 70 and not teacher_angry:
	grade = 'C'
elif score >= 60 and not teacher_angry:
	grade = 'D'
else:
	grade = 'E'
print('Grade is ' + grade)

a = 5
b = 0
c = 0
if a == 5:
	b = 1
	if b + c == 1:
		b = 5
		c = 5
	else:
		c = 2
if a == 5 and b == 5 and c == 5:
	print('OK')`
);
exampleCode('example4',
`# For loop of list
number = [1, 2, 3, 4, 5]
for k in number:
	print(k)
print('-------------------------')

# For loop of str
for c in 'hello, world':
	print(c)
print('-------------------------')

# While loop
a = 323
b = 68
while b != 0:
	t = a % b
	a = b
	b = t
print(a)`
);
exampleCode('example5',
`# Naïve function
def f(x): print(x)
for i in [None, 42, 1.5, 'apple', 'pen']: f(i)
print('-------------------------')

# Recursion
def fact(n):
	if n == 1:
		return 1
	else:
		return n * fact(n - 1)
print(fact(5))`
);
exampleCode('example6',
`class Parent:
	
	id = 0
	
	def __init__(self, k):
		print("I'm parent.")
		self.id = k
	
	def update(self, num):
		self.id = self.id + num
	
	def get_id(self):
		return self.id
	
class Son(Parent):

	def __init__(self, k):
		print("I'm son.")
		self.id = k
	
	def update(self, num):
		self.id = self.id * num

a = Parent(5)
a.update(2)
print(a.get_id())

b = Son(5)
b.update(2)
print(b.get_id())`
);
exampleCode('clear', '');
