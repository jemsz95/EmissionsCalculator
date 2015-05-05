(function() {
    var app = angular.module('emisionsCalculator', ['ngResource']);

    app.controller('CaculatorCtlr',['$scope', '$http', function($scope, $http) {
        $scope.data = [];
        $scope.sections = [];
        $scope.completedSectionsIds = [];
        $scope.isFull = false;
        $scope.isDirty = false;

        $scope.sections = $scope.data.sections;

        $http.get('/appData.json').
            success(function(data, status, headers, config) {
                $scope.data = data;
                $scope.sections = $scope.data.sections;
            }).
            error(function(data, status, headers, config) {

        });

        $scope.calculate = function() {
            $scope.calculator.result = 0;

            angular.forEach($scope.sections, function(value, key, obj) {
                //console.log(value.result);
                $scope.calculator.result += value.result;
            });

            //console.log('The grand total is: ' + $scope.calculator.result);
        }

        $scope.$on('sectionCalculationComplete', function(e, wasDirty) {
            if(wasDirty) {
                $scope.isDirty = true;

                $scope.calculate();
            }
        });

        $scope.displayResult = function(){
            Materialize.toast('Tus emisiones en casa son: ' + $scope.calculator.result + 'TCO2Eq.', 4000);
        }
    }]);


    app.controller('SectionCtlr', function($scope) {
        $scope.questionModifiers = angular.copy($scope.$parent.data.factors);
        $scope.completedQuestionsIds = [];
        $scope.isDirty = false;

        $scope.calculate = function() {
            if($scope.isDirty) {
                $scope.section.result = 0;

                angular.forEach($scope.section.questions, function(value, key, obj) {
                    $scope.section.result += value.result;
                    console.log('Section ' + $scope.section.id + ' question ' + value.id + ': ' + value.result);
                });
            }

            $scope.$emit('sectionCalculationComplete', $scope.isDirty)

            $scope.isDirty = false;
        }

        $scope.$on('questionCalculationComplete', function(e, wasDirty) {
            if(wasDirty) {
                $scope.isDirty = true;

                if($scope.completedQuestionsIds.indexOf(e.targetScope.question.id) === -1) {
                                        //First time question has been answered
                    $scope.completedQuestionsIds.push(e.targetScope.question.id);
                }
            }

            $scope.calculate();
        });

        $scope.$on('mustCheckSiblingDependencies', function(e, id) {
            //Executes all calculations that depend on the given question
            $scope.$broadcast('mustCheckDependencies', id);
        });

        $scope.$on('waitForDependancy', function(e, dependantScope, dependancyId) {
            //Execute if dependancy is ready. Ignore if not.
            //(The actual calculation will be done when the mustCheckDependencies broadcast is recieved)


            if($scope.completedQuestionsIds.indexOf(dependancyId) != -1) {
                dependantScope.calculate();
            }
        });
    });


    app.controller('QuestionCtlr', function($scope) {
        $scope.isDirty = true;
        $scope.isEmpty = true;
        $scope.questionExec = new Function('vars', 'answer', $scope.question.exec);

        if($scope.question.answerType !== 2) {
            $scope.question.answer = [];

            for(var i = 0; i < $scope.question.options.length; i++) {
                $scope.question.answer[i] = 0;
            }
        }else {
            $scope.question.answer = 0;
        }

        $scope.calculate = function() {
                if($scope.isDirty) {
                    $scope.question.result = $scope.questionExec($scope.$parent.questionModifiers, $scope.question.answer);
                if($scope.question.result == -1) {
                    $scope.question.result = 0;
                    $scope.$emit('mustCheckSiblingDependencies', $scope.question.id);
                }
            }

            $scope.$emit('questionCalculationComplete', $scope.isDirty);

            $scope.isDirty = false;
        }

        $scope.answerChange = function() {
            $scope.isDirty = true;
            $scope.isEmpty = false;

            if($scope.question.requires != 0) {
                //Question depends on another
                $scope.$emit('waitForDependancy', $scope, $scope.question.requires);
            } else {
                //Question has no dependancies
                $scope.calculate();
            }
        }

        $scope.$on('mustCheckDependencies', function(e, id) {

            if($scope.question.requires == id) {
                $scope.isDirty = true;

                if(!$scope.isEmpty) {
                    $scope.calculate();
                }
            }
        });

        $scope.$on('forceRecalculate', function() {
            $scope.answerChange();
        });
    });
})();
