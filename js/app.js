(function() {
    var app = angular.module('emisionsCalculator');

    app.controller('calculatorController', function($scope) {
        $scope.calculate = function() {

        }
    });

    app.controller('SectionsCtlr', function($scope) {
        $scope.questionModifiers = {};
        $scope.questionUpdates = 0;
        $scope.isDirty = false;

        $scope.calculate = function() {
            if($scope.isDirty) {

            }
        }

        $scope.on("questionCalculationComplete", function(e, wasDirty) {
            if(wasDirty) {
                $scope.isDirty = true;
            }

            questionUpdates++;

            if(questionUpdates == $scope.questions.length) {
                $scope.calculate();
                questionUpdates = 0;
            }
        });
    });


    app.controller('QuestionCtlr', function($scope) {
        $scope.isDirty = false;
        $scope.answer = 0;
        $scope.questionExec = new Function('gVars', 'answer', $scope.question.exec)

        $scope.calculate = function() {

            if($scope.isDirty) {
                $scope.result = $scope.questionExec($scope.$parent.questionModifiers, $scope.answer);
            }

            $scope.emit("questionCalculationComplete", $scope.isDirty)

            $scope.isDirty = false;
        }

        $scope.setDirty() {
            $scope.isDirty = true;
        }
    });


})();
