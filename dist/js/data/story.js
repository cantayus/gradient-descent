// The story: why Theta goes where Theta goes. A chapter is read before the level it is keyed to, once, and can be read again from the title.
// It is the search every learning machine makes, told as a journey: each country is somebody's best answer to the question "where is the lowest valley?",
// each one fails for the reason that country teaches, and whoever lives there knows of somewhere else to try.
// Kept short on purpose. Nobody in it speaks; things are shown, pointed at, or known.
// Two pages come before the first chapter, at the owner's wish for a deeper beginning: what the name of the game means and where it comes from, and who
// Theta is. What they say of the method and of Cauchy is history, checked (the note of 18 October 1847 to the Académie des Sciences; his work that year on
// the orbits of planets and comets; gradient from the Latin gradiens, stepping). What they say of Theta is the life of a parameter, told as a life:
// begun somewhere by chance, unable to see far, corrected by every step.
export const ROUTE = ['Cappadocia', 'Iceland', 'Galápagos', 'Namib', 'Zhangjiajie', 'Patagonia', 'New Zealand'];
export const STORY = {
  name: { title: 'Gradient Descent', label: 'The name', num: 'i', art: 'steps', lines: [
    'The name of this game is two old words. Gradient comes from the Latin for stepping. Descent is going down.',
    'Together they are the name of a method. In Paris, in October 1847, the mathematician Augustin-Louis Cauchy set it down in three pages. He wanted it for working out the orbits of planets and comets, which took enormous amounts of arithmetic.',
    'It goes like this. Stand anywhere. Feel which way the ground falls, and how steeply. Take a step that way: a long one where it is steep, a short one where it is nearly level. Then do it again.',
    'For a long time it was a way of doing sums. Then machines began to learn, and this turned out to be how they do it. A machine keeps one number that says how wrong it is, and steps downhill on that number until it can get no lower.',
    'This is the story of one such traveller.'] },
  theta: { title: 'Theta', label: 'The traveller', num: 'ii', art: 'theta', lines: [
    'Theta is named for a Greek letter, θ. It is the letter people write for everything a learning machine is able to change about itself. To teach a machine is to move its θ, a little at a time, to where the error is least.',
    'Like every θ, this one began somewhere high up and nowhere in particular. Nobody chose the place: a ridge among chimneys of pale rock, with the valleys a long way below and no map of any of them.',
    'Theta has never been able to see far. What Theta has is the ground underfoot: how steep it is, and which way it falls. It has always been enough for one more step.',
    'Theta is often wrong, and does not mind it much. A wrong step is still a step, and the ground at the new place says what to do next.',
    'There are two friends to meet on the way. Eta, a firefly, is named for the letter η: how long a step to take. Mu, a small bird, is named for μ: how much of the last step to keep. Neither of them knows where the lowest valley is, either.'] },
  '1-1': { title: 'The seed', at: 0, lines: [
    'A seed of light fell out of the sky and came down beside a sleeper.',
    'The old stories say what to do with one. Carry it downhill. It will grow only in the lowest valley in the world.',
    'The stories do not say where that is. Nobody has seen the whole world, so nobody can simply point.',
    'But there is a way to find low ground without seeing it, and Theta has never known any other way to walk.'] },
  '2-1': { title: 'An island still being made', at: 1, lines: [
    'The lowest ground in Cappadocia was the valley of the Dovecotes, and Theta set the seed down in it.',
    'It would not root. From the basket of a balloon Theta saw why: the whole country stands on a high plateau, a thousand metres above the sea.',
    'The pigeons, who always know the way, pointed north: to an island where the ground is still being made.'] },
  '3-1': { title: 'The edge of the sea', at: 2, lines: [
    'Every crater in Iceland looked like the lowest place there was, from inside it.',
    'None of them would do. The ground there is too new, and still boiling.',
    'A puffin, who had crossed more sea than anyone, knew where all high ground ends. They went south and down, to the edge of the sea.'] },
  '4-1': { title: 'Where the river stops', at: 3, lines: [
    'The shore was low enough. But the sea would not leave it alone, and twice a day the tide took the ground back.',
    'An old tortoise had watched water all its life. Water always knows the way down.',
    'So they found a river, and followed it to the place where it stops.'] },
  '5-1': { title: 'The ravines', at: 4, lines: [
    'The river stopped in a white pan between the dunes, flat as a table. Trees had grown there once. They were still standing, dead for centuries.',
    'Wherever the seed belonged, it was somewhere with water.',
    'The oryx looked east, toward mountains that live in cloud.'] },
  '6-1': { title: 'The far end of the world', at: 5, lines: [
    'Between the pillars the ravines went down and down. They were deep enough.',
    'They were also so narrow that the sun never reached the floor, and a seed of light needs sky.',
    'The macaques had heard of valleys cut wide by ice, at the far end of the world.'] },
  '7-1': { title: 'The far side of the wind', at: 6, lines: [
    'Ice had cut those valleys wide and deep. The wind in them could knock a traveller flat, and nothing small stayed where it was put.',
    'An albatross rides that wind right round the world. It knew of a coast on the far side, where ice cut the valleys so deep that the sea has come in to fill them.',
    'It rains there one day in two, and the trees stand in moss. If anything that took root long ago is still growing, it is growing there.'] },
  end: { title: 'The lowest valley', at: 6, lines: [
    'In the far south-west of New Zealand the streams run down through a forest deep in moss, and Theta followed them, one step at a time.',
    'They came to rest in a hollow among trees older than anyone could say. Below it there were only cracks in the rock, where nothing grows. No lower ground was left that could hold a root.',
    'Theta set the seed down, and it took root.'] },
};
