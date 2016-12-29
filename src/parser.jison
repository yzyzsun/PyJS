/**
 * Created by yzyzsun on 2016/12/23.
 */

%lex

ID      [A-Za-z_][A-Za-z0-9_]*
BIN     [01]
OCT     [0-7]
DEC     [0-9]
HEX     [0-9A-Fa-f]
EXP     [Ee][+-]?{DEC}+
SPACE   [ \t]
NEWLINE \n|\r\n?

%%

{DEC}+{EXP}             return 'FLOAT';
{DEC}+"."{DEC}*{EXP}?   return 'FLOAT';
{DEC}*"."{DEC}+{EXP}?   return 'FLOAT';

[1-9]{DEC}*     return 'DEC_INTEGER';
0[Bb]{BIN}+     return 'BIN_INTEGER';
0[Oo]{OCT}+     return 'OCT_INTEGER';
0[Xx]{HEX}+     return 'HEX_INTEGER';
0+              return 'DEC_INTEGER';

\'(\\(.|\n)|[^\\'])*\'   return 'STRING_LITERAL';
\"(\\(.|\n)|[^\\"])*\"   return 'STRING_LITERAL';

"False" return 'FALSE';
"None"  return 'NONE';
"True"  return 'TRUE';

"and"       return 'AND';
"break"     return 'BREAK';
"class"     return 'CLASS';
"continue"  return 'CONTINUE';
"def"       return 'DEF';
"del"       return 'DEL';
"elif"      return 'ELIF';
"else"      return 'ELSE';
"for"       return 'FOR';
"global"    return 'GLOBAL';
"if"        return 'IF';
"in"        return 'IN';
"is"        return 'IS';
"nonlocal"  return 'NONLOCAL';
"not"       return 'NOT';
"or"        return 'OR';
"pass"      return 'PASS';
"return"    return 'RETURN';
"while"     return 'WHILE';

{ID}    return 'IDENTIFIER';

"**="   return '**=';
"//="   return '//=';
"<<="   return '<<=';
">>="   return '>>=';

"=="    return '==';
"!="    return '!=';
"<="    return '<=';
">="    return '>=';
"**"    return '**';
"//"    return '//';
"<<"    return '<<';
">>"    return '>>';
"+="    return '+=';
"-="    return '-=';
"*="    return '*=';
"/="    return '/=';
"%="    return '%=';
"&="    return '&=';
"^="    return '^=';
"|="    return '|=';

"<"     return '<';
">"     return '>';
"+"     return '+';
"-"     return '-';
"*"     return '*';
"/"     return '/';
"%"     return '%';
"~"     return '~';
"&"     return '&';
"^"     return '^';
"|"     return '|';
"="     return '=';
"("     return '(';
")"     return ')';
"["     return '[';
"]"     return ']';
"{"     return '{';
"}"     return '}';
":"     return ':';
","     return ',';
";"     return ';';
"."     return '.';
"@"     return '@';

({NEWLINE}{SPACE}*)+<<EOF>>     {
                                    var tokens = ['NEWLINE'];
                                    while (indentStack.pop() !== '') {
                                        tokens.unshift('DEDENT');
                                    }
                                    return tokens;
                                }

({NEWLINE}{SPACE}*)+/{NEWLINE}  /* skip blank lines */

{NEWLINE}{SPACE}*   {
                        var current = yytext.replace(/[\r\n]/g, '');
                        var last = indentStack[indentStack.length - 1];
                        if (current.startsWith(last)) {
                            if (current.length > last.length) {
                                indentStack.push(current);
                                return ['INDENT', 'NEWLINE'];
                            }
                        }
                        var tokens = ['NEWLINE'];
                        while (current.length < last.length) {
                            indentStack.pop();
                            last = indentStack[indentStack.length - 1];
                            tokens.unshift('DEDENT');
                        }
                        if (current === last) {
                            return tokens;
                        } else {
                            this.parseError(`Indentation on line ${yylineno + 1} does not match any level`, {});
                        }
                    }

{SPACE}+    /* skip other whitespace */

%%

indentStack = ['']

/lex

%options token-stack

%left   OR
%left   AND
%right  NOT
%nonassoc   IN IS '==' '!=' '<' '>' '<=' '>='
%left   '|'
%left   '^'
%left   '&'
%left   '<<' '>>'
%left   '+' '-'
%left   '*' '/' '//' '%'
%right  POS NEG '~'
%right  '**'

%start file_input

%%

file_input
    : statement_or_newline
    | file_input statement_or_newline
        { $$ = $1.concat($2); }
    ;

statement_or_newline
    : statement
    | NEWLINE
        { $$ = []; }
    ;

statement
    : stmt_list NEWLINE
    | compound_stmt
        { $$ = [$1]; }
    ;

stmt_list
    : simple_stmt
        { $$ = [$1]; }
    | stmt_list ';' simple_stmt
        { $$ = $1; $$.push($3); }
    ;

simple_stmt
    : expression_stmt
    | assignment_stmt
    | augmented_assignment_stmt
    | PASS
        { $$ = ['pass']; }
    | DEL target
        { $$ = ['del', $2]; }
    | return_stmt
    | BREAK
        { $$ = ['break']; }
    | CONTINUE
        { $$ = ['continue']; }
    | GLOBAL global_list
        { $$ = ['global', $2]; }
    | NONLOCAL nonlocal_list
        { $$ = ['nonlocal', $2]; }
    ;

expression_stmt
    : expression
    ;

expression
    : expr
    | expr IF expr ELSE expression
        { $$ = ['conditional', $3, $1, $5]; }
    ;

expr
    : primary
    | expr OR expr
        { $$ = ['or', $1, $3]; }
    | expr AND expr
        { $$ = ['and', $1, $3]; }
    | NOT expr
        { $$ = ['not', $2]; }
    | expr IS expr
        { $$ = ['is', $1, $3]; }
    | expr IN expr
        { $$ = ['call', ['attributeref', $1, '__contains__'], [$3]]; }
    | expr '==' expr
        { $$ = ['call', ['attributeref', $1, '__eq__'], [$3]]; }
    | expr '!=' expr
        { $$ = ['call', ['attributeref', $1, '__ne__'], [$3]]; }
    | expr '<' expr
        { $$ = ['call', ['attributeref', $1, '__lt__'], [$3]]; }
    | expr '>' expr
        { $$ = ['call', ['attributeref', $1, '__gt__'], [$3]]; }
    | expr '<=' expr
        { $$ = ['call', ['attributeref', $1, '__le__'], [$3]]; }
    | expr '>=' expr
        { $$ = ['call', ['attributeref', $1, '__ge__'], [$3]]; }
    | expr '|' expr
        { $$ = ['call', ['attributeref', $1, '__or__'], [$3]]; }
    | expr '^' expr
        { $$ = ['call', ['attributeref', $1, '__xor__'], [$3]]; }
    | expr '&' expr
        { $$ = ['call', ['attributeref', $1, '__and__'], [$3]]; }
    | expr '<<' expr
        { $$ = ['call', ['attributeref', $1, '__lshift__'], [$3]]; }
    | expr '>>' expr
        { $$ = ['call', ['attributeref', $1, '__rshift__'], [$3]]; }
    | expr '+' expr
        { $$ = ['call', ['attributeref', $1, '__add__'], [$3]]; }
    | expr '-' expr
        { $$ = ['call', ['attributeref', $1, '__sub__'], [$3]]; }
    | expr '*' expr
        { $$ = ['call', ['attributeref', $1, '__mul__'], [$3]]; }
    | expr '/' expr
        { $$ = ['call', ['attributeref', $1, '__truediv__'], [$3]]; }
    | expr '//' expr
        { $$ = ['call', ['attributeref', $1, '__floordiv__'], [$3]]; }
    | expr '%' expr
        { $$ = ['call', ['attributeref', $1, '__mod__'], [$3]]; }
    | '+' expr %prec POS
        { $$ = ['call', ['attributeref', $1, '__pos__'], []]; }
    | '-' expr %prec NEG
        { $$ = ['call', ['attributeref', $1, '__neg__'], []]; }
    | '~' expr
        { $$ = ['call', ['attributeref', $1, '__invert__'], []]; }
    | expr '**' expr
        { $$ = ['call', ['attributeref', $1, '__pow__'], [$3]]; }
    ;

primary
    : target
    | literal
    | '(' expression ')'
        { $$ = $2; }
    | '[' expression_list ']'
        { $$ = ['list', $2]; }
    | '{' expression_list '}'
        { $$ = ['set', new Set($2)]; }
    | '{' key_datum_list '}'
        { $$ = ['dict', new Map($2)]; }
    | primary argument_list_enclosure
        { $$ = ['call', $1, $2]; }
    ;

target
    : identifier
    | primary '.' IDENTIFIER
        { $$ = ['attributeref', $1, $3]; }
    | primary '[' expression ']'
        { $$ = ['subscription', $1, $3]; }
    ;

identifier
    : IDENTIFIER
        { $$ = ['identifier', $1]; }
    ;

argument_list_enclosure
    : '(' ')'
        { $$ = []; }
    | '(' argument_list ')'
        { $$ = $2; }
    ;

argument_list
    : expression
        { $$ = [$1]; }
    | argument_list ',' expression
        { $$ = $1; $$.push($3); }
    ;

literal
    : STRING_LITERAL
        { $$ = ['str', parseString($1)]; }
    | FLOAT
        { $$ = ['float', parseFloat($1)]; }
    | DEC_INTEGER
        { $$ = ['int', parseInt($1)]; }
    | BIN_INTEGER
        { $$ = ['int', parseInt($1.slice(2), 2)]; }
    | OCT_INTEGER
        { $$ = ['int', parseInt($1.slice(2), 8)]; }
    | HEX_INTEGER
        { $$ = ['int', parseInt($1)]; }
    | TRUE
        { $$ = ['bool', true]; }
    | FALSE
        { $$ = ['bool', false]; }
    | NONE
        { $$ = ['NoneType', null]; }
    ;

expression_list
    : expression
        { $$ = [$1]; }
    | expression_list ',' expression
        { $$ = $1; $$.push($3); }
    ;

key_datum_list
    : expression ':' expression
        { $$ = [[$1, $3]]; }
    | key_datum_list ',' expression ':' expression
        { $$ = $1; $$.push([$3, $5]); }
    ;

assignment_stmt
    : target '=' expression
        { $$ = ['assign', $1, $3]; }
    | target '=' assignment_stmt
        { $$ = ['assign', $1, $3]; }
    ;

augmented_assignment_stmt
    : target '+=' expression
        { $$ = ['call', ['attributeref', $1, '__iadd__'], [$3]]; }
    | target '-=' expression
        { $$ = ['call', ['attributeref', $1, '__isub__'], [$3]]; }
    | target '*=' expression
        { $$ = ['call', ['attributeref', $1, '__imul__'], [$3]]; }
    | target '/=' expression
        { $$ = ['call', ['attributeref', $1, '__itruediv__'], [$3]]; }
    | target '//=' expression
        { $$ = ['call', ['attributeref', $1, '__ifloordiv__'], [$3]]; }
    | target '%=' expression
        { $$ = ['call', ['attributeref', $1, '__imod__'], [$3]]; }
    | target '**=' expression
        { $$ = ['call', ['attributeref', $1, '__ipow__'], [$3]]; }
    | target '<<=' expression
        { $$ = ['call', ['attributeref', $1, '__ilshift__'], [$3]]; }
    | target '>>=' expression
        { $$ = ['call', ['attributeref', $1, '__irshift__'], [$3]]; }
    | target '&=' expression
        { $$ = ['call', ['attributeref', $1, '__iand__'], [$3]]; }
    | target '^=' expression
        { $$ = ['call', ['attributeref', $1, '__ixor__'], [$3]]; }
    | target '|=' expression
        { $$ = ['call', ['attributeref', $1, '__ior__'], [$3]]; }
    ;

return_stmt
    : RETURN
        { $$ = ['return', null]; }
    | RETURN expression
        { $$ = ['return', $2]; }
    ;

global_list
    : identifier
        { $$ = [$1]; }
    | global_list ',' identifier
        { $$ = $1; $$.push($3); }
    ;

nonlocal_list
    : identifier
        { $$ = [$1]; }
    | nonlocal_list ',' identifier
        { $$ = $1; $$.push($3); }
    ;

compound_stmt
    : if_stmt
    | while_stmt
    | for_stmt
    | funcdef
    | classdef
    ;

suite
    : stmt_list NEWLINE
    | NEWLINE INDENT statements DEDENT
        { $$ = $3; }
    ;

statements
    : statement
        { $$ = [$1]; }
    | statements statement
        { $$ = $1; $$.push($2); }
    ;

if_stmt
    : IF expression ':' suite
        { $$ = ['if', $2, $4, [], []]; }
    | IF expression ':' suite ELSE ':' suite
        { $$ = ['if', $2, $4, [], $7]; }
    | IF expression ':' suite elif_suite
        { $$ = ['if', $2, $4, $5, []]; }
    | IF expression ':' suite elif_suite ELSE ':' suite
        { $$ = ['if', $2, $4, $5, $8]; }
    ;

elif_suite
    : ELIF expression ':' suite
        { $$ = [['elif', $2, $4]]; }
    | elif_suite ELIF expression ':' suite
        { $$ = $1; $$.push(['elif', $3, $5]); }
    ;

while_stmt
    : WHILE expression ':' suite
        { $$ = ['while', $2, $4, []]; }
    | WHILE expression ':' suite ELSE ':' suite
        { $$ = ['while', $2, $4, $7]; }
    ;

for_stmt
    : FOR target IN expression ':' suite
        { $$ = ['for', $2, $4, $6, []]; }
    | FOR target IN expression ':' suite ELSE ':' suite
        { $$ = ['for', $2, $4, $6, $9]; }
    ;

funcdef
    : DEF identifier parameter_list_enclosure ':' suite
        { $$ = ['def', null, $2, $3, $5]; }
    | decorator DEF identifier parameter_list_enclosure ':' suite
        { $$ = ['def', $1, $3, $4, $6]; }
    ;

decorator
    : '@' identifier NEWLINE
        { $$ = $2; }
    ;

parameter_list_enclosure
    : '(' ')'
        { $$ = []; }
    | '(' parameter_list ')'
        { $$ = $2; }
    ;

parameter_list
    : identifier
        { $$ = [$1]; }
    | parameter_list ',' identifier
        { $$ = $1; $$.push($3); }
    ;

classdef
    : CLASS identifier ':' suite
        { $$ = ['class', $2, [], $4]; }
    | CLASS identifier '(' argument_list ')' ':' suite
        { $$ = ['class', $2, $4, $7]; }
    ;

%%

function parseString(str) {
    return str.slice(1, -1)
              .replace('\\\n', '')
              .replace('\\\\', '\\')
              .replace("\\'", "'")
              .replace('\\"', '"')
              .replace('\\b', '\b')
              .replace('\\f', '\f')
              .replace('\\n', '\n')
              .replace('\\r', '\r')
              .replace('\\t', '\t')
              .replace('\\v', '\v');
}
