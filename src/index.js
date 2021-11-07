 import React from 'react';
 import ReactDOM from 'react-dom';
 import './index.css';

var emphasized_button = null;  // глобальная переменная, хранящая в процессе всей игры нажатую кнопку в игровой истории

/* Компонента нашего приложения "Клетка" в виде одной функции (или "функциональная компонента "Клетка"): */
function Square(props) {
	return (
		<button
			className="square"
			onClick={ props.onClick }
		>
			{props.value}
		</button>
    );
}

/*
	Компонента "Игровое поле", которое управляется вышестоящей в иерархии компонент
	этого приложения компонентой "Игра", и управляет нижестоящей компонентой "Клетка":
*/
class Board extends React.Component {
	// Отрисовать очередную клетку:
	renderSquare(i) {
		return (
			<Square
				value={ this.props.squares[i] }  // передаём очередной клетке её порядковый номер...
				onClick={ () => this.props.onClick(i) }  // ...и передаём ей обработчик нажатия по ней
			/>
		);
	}
	
	// Отрисовать игровое поле со всеми клетками:
	// (ИСПОЛЬЗОВАТЬ ВЛОЖЕННЫЙ ЦИКЛ ПО ЗАДАНИЮ С САЙТА "https://ru.reactjs.org/tutorial/tutorial.html"!)
	render() {
			const N = 3;
			
			let line = [];
			let square = [];
			
			// Тут главный принцип: jsx-компилятор умеет соединять в html-код ЭЛЕМЕНТЫ МАССИВОВ!
			let counter=0
			for (let i = 0; i < N; ++i) {
				for (let j = 0; j < N; ++j)
					square.push(this.renderSquare(counter++));
				line.push(<div className="board-row">{square}</div>);
				square = [];
			}
			
			return (<div><div className="status">{this.props.status}</div>{line}</div>);
	}
}

/* Компонента "Игра", представляющая собой и клетки, и игровое поле с этими клетками, и историю ходов, и координаты отмеченной клетки: */
class Game extends React.Component {
	/* Метод-конструктор, инициализирующий начальное состояние игры (историю, номер текущего хода и ходящего сейчас игрока): */
	constructor(props) {
		super(props);
		this.state= {
			history: [{
				squares: Array(9).fill(null),
				coords: Array(2).fill(null),
			}],
			stepNumber: 0,
			xIsNext: true,
		};
	}
	
	/* Обработчик события нажатия по клетке игрового поля : */
	handleClick(i) {
		/* 
			Берём историю за весь предшествующий только что сделанному ходу промежуток времени.
		Обрати внимание, что мы копируем эту историю из "this.state.history" в новый массив "history",
		а не работаем с прежним массивом. Это нужно, чтобы было проще отслеживать изменения во всей
		игровой истории!
		*/
		const history = this.state.history.slice(0, this.state.stepNumber + 1);
		
		// берём последнюю запись из массива "history":
		const current = history[history.length - 1];
		// копируем текущее состояние игрового поля и сохраняем его в переменную "squares":
		const squares = current.squares.slice();
		// то же самое делаем и с объектом "coords":
		let coords = current.coords.slice();
		
		// если победитель уже выявлен или нажимаемая клетка поля уже использована раньше,
		// то повторно помечать эту клетку не нужно - просто прекращаем выполнение дальнейших действий:
		if (calculateWinner(squares) || squares[i]) {
			return;
		}
		
		// Определяем координаты нажатой клетки поля по её порядковому номеру:
		switch(i) {
			case 0:
				coords = [0, 0];
				break;
			case 1:
				coords = [1, 0];
				break;
			case 2:
				coords = [2, 0];
				break;
			case 3:
				coords = [0, 1];
				break;
			case 4:
				coords = [1, 1];
				break;
			case 5:
				coords = [2, 1];
				break;
			case 6:
				coords = [0, 2];
				break;
			case 7:
				coords = [1, 2];
				break;
			case 8:
				coords = [2, 2];
				break;
		}
		
		// определяем и сохраняем новое состояние клетки игрового поля:
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
				history: history.concat([{
				squares: squares,  // здесь мы обновляем массив со всеми игровыми клетками, сохраняя сюда только что отредактированную копию массива "squares" (см. комментарий в начале этого метода)
				coords: coords,   // а тут сохраняем координаты сделанного хода
			}]),
			stepNumber: history.length,  // обновляем также номер следующего хода
			xIsNext: !this.state.xIsNext,  // инвертируем флаг, определяющий следующего игрока (X или O)
		});
    }
	
	/* 
		Метод, который вызывается при переходе на ход игры, предшествовавший текущему ходу;
	то есть при нажатии по одной из кнопок истории:
	*/
	jumpTo(step) {
		this.setState({
			stepNumber: step,
			xIsNext: (step % 2) === 0,
		});
	}
	
	/* Отрисовка клеток, игрового поля и истории с надписью (справа от поля): */
    render() {
		const history = this.state.history;
		const current = history[this.state.stepNumber];
		const winner = calculateWinner(current.squares);
		
		const moves = history.map((step, move) => {
			const desc = move ?
				'Перейти к ходу #' + move + ' (' + String((history[move]).coords[0]) + ';' + String((history[move]).coords[1]) + ')' :  // если move > 0, то приписываем очередной кнопке в нашей истории игры, название с номером соответствующего хода
				'К началу игры';  // если же move = 0, то это начало истории
				
			return (
				<HistoryRecord
					desc = {desc}
					move = {move}
					onClick={(e) => {
						this.jumpTo(move);
						
						/* Логика выделения нажатой кнопки в истории: */
						if (( emphasized_button ) && (emphasized_button != e.currentTarget)) {  // если есть уже выделенная кнопка, а сейчас нажата другая - невыделенная - кнопка, то...
							emphasized_button.classList.remove('emphasized');  // удалить стили выделенной кнопки с нажатой ранее кнопки в истории
							e.currentTarget.classList.add('emphasized');  // выделить нажатую непосредственно в текущий момент времени кнопку
							emphasized_button = e.currentTarget;  // сохранить её в глобальную переменную вместо нажатой ещё раньше
						} else if ( !emphasized_button ) {  // если же вообще нет выделенной кнопки, то есть мы нажимаем на историю в первый раз, то...
							e.currentTarget.classList.add("emphasized");  // выделить нажатую впервые за игру кнопку в истории
							emphasized_button = e.currentTarget;  // и сохранить эту кнопку в глобальную переменную, чтобы её не потерять
						}
						}}
				/>
			);
		});
			
		let status;  // изменяем поясняющую надпись ниже
		if (winner) {
			status = 'Выиграл ' + winner;
		} else {
			status = 'Следующий ход: ' + (this.state.xIsNext ? 'X' : 'O');
		}
		
		return (
			<div className="game">
				<div className="game-board">
					<Board 
						squares={current.squares}
						onClick={(i) => this.handleClick(i)}
					/>
				</div>
				<div className="game-info">
					<div>{status}</div>
					<ol>{moves}</ol>
				</div>
			</div>
		);
	}
}

/* Дополнительный вспомогательный метод, выявляющий факт окончания игры - победу одного из игроков: */
function calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
	
    for (let i = 0; i < lines.length; ++i) {
		const [a, b, c] = lines[i];
		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return squares[a];
		}
    }
	
    return null;
}

/*
	Необязательный класс-компонент - кнопка в истории игры.
Эту кнопку (точнее, HTML-код этой кнопки) можно вставить прямо в метод "render()" компоненты "Game"!
*/
class HistoryRecord extends React.Component {
	render() {
		return(
			<li key={this.props.move}>
				<button onClick={this.props.onClick}>{this.props.desc}</button>
			</li>
		);
	};
}

// ========================================

ReactDOM.render(
	<Game />,
	document.getElementById('root')
);
